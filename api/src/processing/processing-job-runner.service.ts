import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FeedOrchestratorService } from '../feed/feed-orchestrator.service';
import type {
  RankingMovementFeedInput,
  RankingMovementFeedMovement,
  RankingMovementFeedPlayer,
} from '../feed/types/ranking-movement-feed-input.type';
import { RatingProjectionService } from '../rating/rating-projection.service';
import { GroupMemberStatsProjectionService } from '../ranking/group-member-stats-projection.service';
import { RankingMovementService } from '../ranking/ranking-movement.service';
import { GroupHomeSummaryService } from '../groups/group-home-summary.service';
import { MatchTeam } from '../generated/prisma/enums';
import { errorLogFields, structuredLog } from '../observability/structured-log';
import type { ProcessingJob } from './processing-job.types';

const DEFAULT_LOCK_TIMEOUT_MS = 60_000;
const DEFAULT_TRANSACTION_TIMEOUT_MS = 60_000;
const RANKING_MOVEMENT_FEED_THRESHOLD = 2;

type MatchMember = {
  id: string;
  userId: string;
  displayName: string;
};

type MatchRankingSnapshotRow = {
  matchId: string;
  groupId: string;
  previousLeaders: unknown;
  currentLeaders: unknown;
  dethronedLeaders: unknown;
  movements: unknown;
};

type RankingMovementFeedMatch = {
  id: string;
  groupId: string;
  gamesA: number;
  gamesB: number;
  winnerTeam: MatchTeam | null;
  playedAt: Date;
  players: Array<{
    groupMemberId: string;
    team: MatchTeam;
    position: number;
    groupMember: {
      userId: string;
      user: { firstName: string; lastName: string };
    };
  }>;
};

type SnapshotLeadershipContext = {
  previousLeaders: RankingMovementFeedPlayer[];
  currentLeaders: RankingMovementFeedPlayer[];
  dethronedLeaders: RankingMovementFeedPlayer[];
};

type SnapshotMovement = RankingMovementFeedMovement;

@Injectable()
export class ProcessingJobRunnerService {
  private readonly logger = new Logger(ProcessingJobRunnerService.name);
  private readonly workerId = `api-${process.pid}-${randomUUID()}`;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ratingProjection: RatingProjectionService,
    private readonly rankingMovements: RankingMovementService,
    private readonly groupMemberStatsProjection: GroupMemberStatsProjectionService,
    private readonly feed: FeedOrchestratorService,
    private readonly groupHomeSummary: GroupHomeSummaryService,
  ) {}

  async runNextBatch(limit = 5) {
    await this.releaseStaleProcessingJobs();

    for (let index = 0; index < limit; index += 1) {
      const job = await this.claimNextJob();

      if (!job) {
        return;
      }

      await this.runClaimedJob(job);
    }
  }

  private async releaseStaleProcessingJobs() {
    const staleBefore = new Date(Date.now() - this.getLockTimeoutMs());
    const result = await this.prisma.$executeRaw`
      UPDATE "ProcessingJob"
      SET "status" = 'PENDING', "lockedAt" = NULL, "lockedBy" = NULL
      WHERE "status" = 'PROCESSING'
        AND "lockedAt" IS NOT NULL
        AND "lockedAt" < ${staleBefore}
    `;

    if (result > 0) {
      this.logger.warn(
        structuredLog('processing_job.released_stale_locks', {
          count: result,
          staleBefore: staleBefore.toISOString(),
          workerId: this.workerId,
        }),
      );
    }
  }

  private async claimNextJob() {
    return this.prisma.$transaction(async (tx) => {
      const [job] = await tx.$queryRaw<ProcessingJob[]>`
        SELECT *
        FROM "ProcessingJob"
        WHERE "status" = 'PENDING'
          AND "availableAt" <= NOW()
        ORDER BY "createdAt" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      `;

      if (!job) {
        return null;
      }

      return tx.processingJob.update({
        where: { id: job.id },
        data: {
          status: 'PROCESSING',
          attemptCount: { increment: 1 },
          lockedAt: new Date(),
          lockedBy: this.workerId,
        },
      });
    });
  }

  private async runClaimedJob(job: ProcessingJob) {
    const startedAt = Date.now();

    try {
      this.logger.log(
        structuredLog('processing_job.started', {
          jobId: job.id,
          jobType: job.type,
          groupId: job.groupId,
          matchId: job.matchId,
          attemptCount: job.attemptCount,
          maxAttempts: job.maxAttempts,
          workerId: this.workerId,
        }),
      );

      await this.processJob(job);
      await this.markDone(job.id);

      this.logger.log(
        structuredLog('processing_job.completed', {
          jobId: job.id,
          jobType: job.type,
          groupId: job.groupId,
          matchId: job.matchId,
          attemptCount: job.attemptCount,
          workerId: this.workerId,
          durationMs: Date.now() - startedAt,
        }),
      );
    } catch (error) {
      await this.markFailedOrRetry(job, error, Date.now() - startedAt);
    }
  }

  private async processJob(job: ProcessingJob) {
    switch (job.type) {
      case 'MATCH_CREATED':
      case 'MATCH_UPDATED':
        await this.processGroupProjectionJob(job.groupId, job.matchId, false);
        break;
      case 'MATCH_DELETED':
        await this.processGroupProjectionJob(job.groupId, job.matchId, true);
        break;
      case 'GROUP_RANKING_REBUILD':
        await this.processGroupProjectionJob(job.groupId, null, false);
        break;
      default:
        throw new Error(`Unsupported processing job type: ${job.type}`);
    }
  }

  private async processGroupProjectionJob(
    groupId: string,
    changedMatchId: string | null,
    deleteChangedMatchFeed: boolean,
  ) {
    await this.prisma.$transaction(
      async (tx) => {
        await this.ratingProjection.syncGroupRatings(tx, groupId);
        await this.rankingMovements.syncGroupRankingState(tx, groupId);
        await this.groupMemberStatsProjection.syncGroupMemberStats(tx, groupId);

        if (changedMatchId && deleteChangedMatchFeed) {
          await this.deleteMatchFeedItems(tx, groupId, changedMatchId);
        } else if (changedMatchId) {
          await this.syncMatchFeedItems(tx, groupId, changedMatchId);
        }

        await this.syncGroupRankingMovementFeedItems(tx, groupId);
        await this.markProjectionCurrent(tx, groupId, changedMatchId);
        await this.groupHomeSummary.syncGroupSummary(groupId, tx);
      },
      { timeout: this.getTransactionTimeoutMs() },
    );
  }

  private async syncMatchFeedItems(
    tx: Prisma.TransactionClient,
    groupId: string,
    matchId: string,
  ) {
    const match = await tx.match.findFirst({
      where: { id: matchId, groupId },
      include: {
        players: {
          orderBy: [{ team: 'asc' }, { position: 'asc' }],
          include: {
            groupMember: {
              select: {
                userId: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    if (!match) {
      return;
    }

    await this.feed.syncMatchFeedItems(match, tx);
  }

  private async deleteMatchFeedItems(
    tx: Prisma.TransactionClient,
    groupId: string,
    matchId: string,
  ) {
    await tx.feedItem.deleteMany({
      where: {
        groupId,
        matchId,
      },
    });
  }

  private async syncGroupRankingMovementFeedItems(tx: Prisma.TransactionClient, groupId: string) {
    const candidates = await this.getVisibleRankingMovementFeedInputs(tx, groupId);

    for (const candidate of candidates) {
      await this.feed.upsertRankingMovementFeedItem(candidate, tx);
    }
  }

  private async getVisibleRankingMovementFeedInputs(
    tx: Prisma.TransactionClient,
    groupId: string,
  ): Promise<RankingMovementFeedInput[]> {
    const rows = await tx.$queryRaw<MatchRankingSnapshotRow[]>`
      SELECT
        mrs."matchId",
        mrs."groupId",
        mrs."previousLeaders",
        mrs."currentLeaders",
        mrs."dethronedLeaders",
        mrs."movements"
      FROM "MatchRankingSnapshot" mrs
      INNER JOIN "Match" m ON m."id" = mrs."matchId" AND m."groupId" = mrs."groupId"
      WHERE mrs."groupId" = ${groupId}
        AND m."deletedAt" IS NULL
      ORDER BY m."playedAt" ASC, m."createdAt" ASC
    `;

    const matches = await this.getRankingMovementMatches(
      tx,
      groupId,
      rows.map((row) => row.matchId),
    );
    const matchById = new Map(matches.map((match) => [match.id, match]));

    return rows
      .flatMap((row) => this.toRankingMovementFeedInputs(row, matchById.get(row.matchId)))
      .filter((input): input is RankingMovementFeedInput => Boolean(input));
  }

  private async getRankingMovementMatches(
    tx: Prisma.TransactionClient,
    groupId: string,
    matchIds: string[],
  ) {
    if (matchIds.length === 0) {
      return [];
    }

    return tx.match.findMany({
      where: {
        groupId,
        id: { in: matchIds },
        deletedAt: null,
      },
      include: {
        players: {
          orderBy: [{ team: 'asc' }, { position: 'asc' }],
          select: {
            groupMemberId: true,
            team: true,
            position: true,
            groupMember: {
              select: {
                userId: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    }) as Promise<RankingMovementFeedMatch[]>;
  }

  private toRankingMovementFeedInputs(
    row: MatchRankingSnapshotRow,
    match?: RankingMovementFeedMatch,
  ) {
    if (!match || !this.isRankingMovementSnapshotVisible(row, match)) {
      return [];
    }

    const leadershipContext = this.parseLeadershipContext(row);
    const movements = this.parseMovements(row);

    return movements
      .map((movement) =>
        this.toRankingMovementFeedInput(row, match, movement, leadershipContext),
      )
      .filter((input): input is RankingMovementFeedInput => Boolean(input));
  }

  private toRankingMovementFeedInput(
    row: MatchRankingSnapshotRow,
    match: RankingMovementFeedMatch,
    movement: SnapshotMovement,
    leadershipContext: SnapshotLeadershipContext,
  ): RankingMovementFeedInput | null {
    const actor = this.getFeedActor(movement.groupMemberId, match);

    if (!actor) {
      return null;
    }

    return {
      groupId: row.groupId,
      matchId: row.matchId,
      actorUserId: actor.userId,
      actorGroupMemberId: movement.groupMemberId,
      subjectUserId: actor.userId,
      occurredAt: match.playedAt,
      movement,
      leadershipContext,
      match: {
        gamesA: match.gamesA,
        gamesB: match.gamesB,
      },
    };
  }

  private getFeedActor(groupMemberId: string, match: RankingMovementFeedMatch): MatchMember | null {
    const player = match.players.find((item) => item.groupMemberId === groupMemberId);

    if (!player) {
      return null;
    }

    return {
      id: groupMemberId,
      userId: player.groupMember.userId,
      displayName: this.getUserDisplayName(player.groupMember.user),
    };
  }

  private isRankingMovementSnapshotVisible(
    row: MatchRankingSnapshotRow,
    match: RankingMovementFeedMatch,
  ) {
    const movements = this.parseMovements(row);

    if (movements.length === 0) {
      return false;
    }

    const largestMovement = movements.reduce(
      (max, movement) => (movement.positions > max ? movement.positions : max),
      0,
    );

    if (largestMovement >= RANKING_MOVEMENT_FEED_THRESHOLD) {
      return true;
    }

    const leadershipContext = this.parseLeadershipContext(row);

    return leadershipContext.dethronedLeaders.length > 0;
  }

  private parseLeadershipContext(row: MatchRankingSnapshotRow): SnapshotLeadershipContext {
    return {
      previousLeaders: this.parseJsonArray<RankingMovementFeedPlayer>(row.previousLeaders),
      currentLeaders: this.parseJsonArray<RankingMovementFeedPlayer>(row.currentLeaders),
      dethronedLeaders: this.parseJsonArray<RankingMovementFeedPlayer>(row.dethronedLeaders),
    };
  }

  private parseMovements(row: MatchRankingSnapshotRow): SnapshotMovement[] {
    return this.parseJsonArray<SnapshotMovement>(row.movements);
  }

  private parseJsonArray<T>(value: unknown): T[] {
    return Array.isArray(value) ? (value as T[]) : [];
  }

  private getUserDisplayName(user: { firstName: string; lastName: string }) {
    return `${user.firstName} ${user.lastName}`.trim();
  }

  private async markProjectionCurrent(
    tx: Prisma.TransactionClient,
    groupId: string,
    changedMatchId: string | null,
  ) {
    await tx.$executeRaw`
      INSERT INTO "GroupRankingProjection" (
        "groupId",
        "status",
        "version",
        "lastProcessedMatchId",
        "lastProcessedAt",
        "lastError",
        "createdAt",
        "updatedAt"
      )
      VALUES (${groupId}, 'CURRENT', 1, ${changedMatchId}, NOW(), NULL, NOW(), NOW())
      ON CONFLICT ("groupId") DO UPDATE SET
        "status" = 'CURRENT',
        "version" = "GroupRankingProjection"."version" + 1,
        "processingJobId" = NULL,
        "lastProcessedMatchId" = ${changedMatchId},
        "lastProcessedAt" = NOW(),
        "lastError" = NULL,
        "updatedAt" = NOW()
    `;
  }

  private async markProjectionFailed(job: ProcessingJob, message: string) {
    await this.prisma.$executeRaw`
      INSERT INTO "GroupRankingProjection" (
        "groupId",
        "status",
        "processingJobId",
        "lastError",
        "createdAt",
        "updatedAt"
      )
      VALUES (${job.groupId}, 'FAILED', ${job.id}, ${message}, NOW(), NOW())
      ON CONFLICT ("groupId") DO UPDATE SET
        "status" = 'FAILED',
        "processingJobId" = ${job.id},
        "lastError" = ${message},
        "updatedAt" = NOW()
    `;

    await this.groupHomeSummary.syncGroupSummary(job.groupId);
  }

  private async markDone(jobId: string) {
    await this.prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status: 'DONE',
        processedAt: new Date(),
        lockedAt: null,
        lockedBy: null,
        lastError: null,
      },
    });
  }

  private async markFailedOrRetry(job: ProcessingJob, error: unknown, durationMs: number) {
    const message = error instanceof Error ? error.message : 'Unknown processing error';
    const shouldRetry = job.attemptCount < job.maxAttempts;

    if (!shouldRetry) {
      this.logger.error(
        structuredLog('processing_job.failed_permanently', {
          jobId: job.id,
          jobType: job.type,
          groupId: job.groupId,
          matchId: job.matchId,
          attemptCount: job.attemptCount,
          maxAttempts: job.maxAttempts,
          workerId: this.workerId,
          durationMs,
          ...errorLogFields(error),
        }),
      );
      await this.markMatchFailed(job, message);
      await this.markProjectionFailed(job, message);
      await this.prisma.processingJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          lockedAt: null,
          lockedBy: null,
          lastError: message,
        },
      });
      return;
    }

    const retryDelaySeconds = Math.min(60, 2 ** job.attemptCount);
    this.logger.warn(
      structuredLog('processing_job.retry_scheduled', {
        jobId: job.id,
        jobType: job.type,
        groupId: job.groupId,
        matchId: job.matchId,
        attemptCount: job.attemptCount,
        maxAttempts: job.maxAttempts,
        retryDelaySeconds,
        workerId: this.workerId,
        durationMs,
        ...errorLogFields(error),
      }),
    );

    await this.prisma.processingJob.update({
      where: { id: job.id },
      data: {
        status: 'PENDING',
        lockedAt: null,
        lockedBy: null,
        lastError: message,
        availableAt: new Date(Date.now() + retryDelaySeconds * 1000),
      },
    });
  }

  private async markMatchFailed(job: ProcessingJob, message: string) {
    if (!job.matchId) {
      return;
    }

    await this.prisma.$executeRaw`
      UPDATE "Match"
      SET "processingStatus" = 'FAILED', "processingError" = ${message}
      WHERE "id" = ${job.matchId}
        AND "groupId" = ${job.groupId}
    `;
  }

  private getLockTimeoutMs() {
    const value = Number(process.env.PROCESSING_JOB_LOCK_TIMEOUT_MS);

    if (Number.isFinite(value) && value > 0) {
      return value;
    }

    return DEFAULT_LOCK_TIMEOUT_MS;
  }

  private getTransactionTimeoutMs() {
    const value = Number(process.env.PROCESSING_JOB_TRANSACTION_TIMEOUT_MS);

    if (Number.isFinite(value) && value > 0) {
      return value;
    }

    return DEFAULT_TRANSACTION_TIMEOUT_MS;
  }
}
