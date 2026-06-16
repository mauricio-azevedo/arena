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

    const result = await this.prisma.processingJob.updateMany({
      where: {
        status: 'PROCESSING',
        lockedAt: { lt: staleBefore },
      },
      data: {
        status: 'PENDING',
        lockedAt: null,
        lockedBy: null,
        availableAt: new Date(),
        lastError: 'Released stale processing lock',
      },
    });

    if (result.count > 0) {
      this.logger.warn(
        structuredLog('processing_job.stale_locks_released', {
          releasedCount: result.count,
          staleBefore: staleBefore.toISOString(),
          workerId: this.workerId,
        }),
      );
    }
  }

  private async claimNextJob() {
    const jobs = await this.prisma.$queryRaw<ProcessingJob[]>`
      UPDATE "ProcessingJob"
      SET
        "status" = 'PROCESSING',
        "lockedAt" = NOW(),
        "lockedBy" = ${this.workerId},
        "attemptCount" = "attemptCount" + 1,
        "updatedAt" = NOW()
      WHERE "id" = (
        SELECT "id"
        FROM "ProcessingJob"
        WHERE "status" = 'PENDING'
          AND "availableAt" <= NOW()
        ORDER BY "availableAt" ASC, "createdAt" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      RETURNING
        "id",
        "type",
        "status",
        "groupId",
        "matchId",
        "payload",
        "attemptCount",
        "maxAttempts",
        "availableAt",
        "lockedAt",
        "lockedBy",
        "lastError",
        "processedAt",
        "createdAt",
        "updatedAt"
    `;

    const job = jobs[0] ?? null;

    if (job) {
      this.logger.log(
        structuredLog('processing_job.claimed', {
          jobId: job.id,
          jobType: job.type,
          jobStatus: job.status,
          groupId: job.groupId,
          matchId: job.matchId,
          attemptCount: job.attemptCount,
          maxAttempts: job.maxAttempts,
          workerId: this.workerId,
        }),
      );
    }

    return job;
  }

  private async runClaimedJob(job: ProcessingJob) {
    const startedAt = Date.now();

    try {
      await this.processJob(job);
      await this.markDone(job.id);
      this.logger.log(
        structuredLog('processing_job.completed', {
          jobId: job.id,
          jobType: job.type,
          groupId: job.groupId,
          matchId: job.matchId,
          workerId: this.workerId,
          durationMs: Date.now() - startedAt,
        }),
      );
    } catch (error) {
      await this.markFailedOrRetry(job, error, Date.now() - startedAt);
    }
  }

  private async processJob(job: ProcessingJob) {
    this.logger.log(
      structuredLog('processing_job.started', {
        jobId: job.id,
        jobType: job.type,
        groupId: job.groupId,
        matchId: job.matchId,
        workerId: this.workerId,
      }),
    );

    await this.markProjectionProcessing(job);

    switch (job.type) {
      case 'MATCH_CREATED':
      case 'MATCH_UPDATED':
        if (!job.matchId) {
          throw new Error('Match processing job requires matchId');
        }
        await this.processGroupProjectionJob(job.groupId, job.matchId, false);
        break;
      case 'MATCH_DELETED':
        if (!job.matchId) {
          throw new Error('Deleted match processing job requires matchId');
        }
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
          include: {
            groupMember: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!match) {
      this.logger.warn(
        structuredLog('feed_projection.skipped', {
          groupId,
          matchId,
          reason: 'MATCH_NOT_FOUND',
        }),
      );
      return;
    }

    const membersById = new Map<string, MatchMember>();

    for (const player of match.players) {
      membersById.set(player.groupMemberId, {
        id: player.groupMemberId,
        userId: player.groupMember.userId,
        displayName: this.getUserDisplayName(player.groupMember.user),
      });
    }

    const teamA = match.players
      .filter((player) => player.team === MatchTeam.TEAM_A)
      .sort((a, b) => a.position - b.position)
      .map((player) => this.getMatchFeedPlayer(player.groupMemberId, membersById));
    const teamB = match.players
      .filter((player) => player.team === MatchTeam.TEAM_B)
      .sort((a, b) => a.position - b.position)
      .map((player) => this.getMatchFeedPlayer(player.groupMemberId, membersById));

    if (teamA.length !== 2 || teamB.length !== 2 || !match.winnerTeam) {
      this.logger.warn(
        structuredLog('feed_projection.skipped', {
          groupId,
          matchId,
          reason: 'INVALID_MATCH_SHAPE',
          teamASize: teamA.length,
          teamBSize: teamB.length,
          hasWinnerTeam: Boolean(match.winnerTeam),
        }),
      );
      return;
    }

    const input = {
      groupId,
      matchId,
      winnerTeam: match.winnerTeam,
      gamesA: match.gamesA,
      gamesB: match.gamesB,
      winners: match.winnerTeam === MatchTeam.TEAM_A ? teamA : teamB,
      losers: match.winnerTeam === MatchTeam.TEAM_A ? teamB : teamA,
      occurredAt: match.playedAt,
    };

    await this.feed.syncMatchBlowoutItem(input, tx);
    await this.feed.syncMatchCloseItem(input, tx);

    this.logger.log(
      structuredLog('feed_projection.completed', {
        groupId,
        matchId,
        winnerTeam: match.winnerTeam,
      }),
    );
  }

  private async deleteMatchFeedItems(
    tx: Prisma.TransactionClient,
    groupId: string,
    matchId: string,
  ) {
    const result = await tx.feedItem.deleteMany({
      where: {
        groupId,
        matchId,
      },
    });

    this.logger.log(
      structuredLog('feed_projection.deleted_match_items', {
        groupId,
        matchId,
        deletedCount: result.count,
      }),
    );
  }

  private async syncGroupRankingMovementFeedItems(
    tx: Prisma.TransactionClient,
    groupId: string,
  ) {
    const inputs = await this.buildRankingMovementFeedInputs(tx, groupId);
    const result = await this.feed.syncGroupRankingMovementItems(groupId, inputs, tx);

    this.logger.log(
      structuredLog('ranking_movement_feed_projection.completed', {
        groupId,
        eligibleMatchCount: result.eligibleMatchCount,
        upsertedCount: result.upsertedCount,
        deletedCount: result.deletedCount,
      }),
    );
  }

  private async buildRankingMovementFeedInputs(
    tx: Prisma.TransactionClient,
    groupId: string,
  ): Promise<RankingMovementFeedInput[]> {
    const snapshots = await tx.$queryRaw<MatchRankingSnapshotRow[]>`
      SELECT
        s."matchId",
        s."groupId",
        s."previousLeaders",
        s."currentLeaders",
        s."dethronedLeaders",
        s."movements"
      FROM "MatchRankingSnapshot" s
      INNER JOIN "Match" m ON m."id" = s."matchId"
      WHERE s."groupId" = ${groupId}
        AND m."deletedAt" IS NULL
      ORDER BY m."playedAt" ASC, m."createdAt" ASC
    `;

    if (snapshots.length === 0) {
      return [];
    }

    const matches = (await tx.match.findMany({
      where: {
        id: {
          in: snapshots.map((snapshot) => snapshot.matchId),
        },
      },
      include: {
        players: {
          include: {
            groupMember: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ playedAt: 'asc' }, { createdAt: 'asc' }],
    })) as RankingMovementFeedMatch[];
    const matchesById = new Map(matches.map((match) => [match.id, match]));

    return snapshots
      .map((snapshot) =>
        this.buildRankingMovementFeedInput(snapshot, matchesById.get(snapshot.matchId) ?? null),
      )
      .filter((input): input is RankingMovementFeedInput => Boolean(input));
  }

  private buildRankingMovementFeedInput(
    snapshot: MatchRankingSnapshotRow,
    match: RankingMovementFeedMatch | null,
  ): RankingMovementFeedInput | null {
    if (!match?.winnerTeam) {
      return null;
    }

    const movements = this.parseSnapshotMovements(snapshot.movements).filter((movement) =>
      this.isRankingMovementFeedEligible(movement),
    );

    if (movements.length === 0) {
      return null;
    }

    const teamA = this.getRankingMovementMatchTeam(match.players, MatchTeam.TEAM_A);
    const teamB = this.getRankingMovementMatchTeam(match.players, MatchTeam.TEAM_B);

    if (teamA.length !== 2 || teamB.length !== 2) {
      return null;
    }

    const leadershipContext = {
      previousLeaders: this.parseSnapshotPlayers(snapshot.previousLeaders),
      currentLeaders: this.parseSnapshotPlayers(snapshot.currentLeaders),
      dethronedLeaders: this.parseSnapshotPlayers(snapshot.dethronedLeaders),
    };

    return {
      groupId: snapshot.groupId,
      matchId: snapshot.matchId,
      winnerTeam: match.winnerTeam,
      gamesA: match.gamesA,
      gamesB: match.gamesB,
      winners: match.winnerTeam === MatchTeam.TEAM_A ? teamA : teamB,
      losers: match.winnerTeam === MatchTeam.TEAM_A ? teamB : teamA,
      movements,
      leadershipChange: this.getLeadershipChange(movements, leadershipContext),
      occurredAt: match.playedAt,
    };
  }

  private isRankingMovementFeedEligible(movement: RankingMovementFeedMovement) {
    return (
      movement.positions >= RANKING_MOVEMENT_FEED_THRESHOLD ||
      (movement.direction === 'UP' && movement.currentRank === 1) ||
      (movement.direction === 'DOWN' && movement.previousRank === 1)
    );
  }

  private getLeadershipChange(
    movements: RankingMovementFeedMovement[],
    leadershipContext: SnapshotLeadershipContext,
  ) {
    const hasLeadershipChange = movements.some(
      (movement) =>
        (movement.direction === 'UP' && movement.currentRank === 1) ||
        (movement.direction === 'DOWN' && movement.previousRank === 1),
    );

    if (!hasLeadershipChange) {
      return null;
    }

    return leadershipContext;
  }

  private getRankingMovementMatchTeam(
    players: RankingMovementFeedMatch['players'],
    team: MatchTeam,
  ) {
    return players
      .filter((player) => player.team === team)
      .sort((a, b) => a.position - b.position)
      .map((player) => ({
        groupMemberId: player.groupMemberId,
        userId: player.groupMember.userId,
        displayName: this.getUserDisplayName(player.groupMember.user),
      }));
  }

  private parseSnapshotMovements(value: unknown): RankingMovementFeedMovement[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((movement): movement is RankingMovementFeedMovement =>
      this.isSnapshotMovement(movement),
    );
  }

  private isSnapshotMovement(value: unknown): value is SnapshotMovement {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const movement = value as Partial<SnapshotMovement>;

    return (
      typeof movement.groupMemberId === 'string' &&
      typeof movement.userId === 'string' &&
      typeof movement.displayName === 'string' &&
      (movement.direction === 'UP' || movement.direction === 'DOWN') &&
      typeof movement.positions === 'number' &&
      typeof movement.previousRank === 'number' &&
      typeof movement.currentRank === 'number' &&
      typeof movement.previousRating === 'number' &&
      typeof movement.currentRating === 'number' &&
      Array.isArray(movement.affectedMembers)
    );
  }

  private parseSnapshotPlayers(value: unknown): RankingMovementFeedPlayer[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((player): player is RankingMovementFeedPlayer =>
      this.isSnapshotPlayer(player),
    );
  }

  private isSnapshotPlayer(value: unknown): value is RankingMovementFeedPlayer {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const player = value as Partial<RankingMovementFeedPlayer>;

    return (
      typeof player.groupMemberId === 'string' &&
      typeof player.userId === 'string' &&
      typeof player.displayName === 'string'
    );
  }

  private getMatchFeedPlayer(
    groupMemberId: string,
    membersById: Map<string, MatchMember>,
  ) {
    const member = membersById.get(groupMemberId);

    if (!member) {
      throw new Error('Invalid match feed player');
    }

    return {
      groupMemberId: member.id,
      userId: member.userId,
      displayName: member.displayName,
    };
  }

  private getUserDisplayName(user: { firstName: string; lastName: string }) {
    return `${user.firstName} ${user.lastName}`.trim();
  }

  private async markProjectionProcessing(job: ProcessingJob) {
    await this.prisma.$executeRaw`
      INSERT INTO "GroupRankingProjection" (
        "groupId",
        "status",
        "processingJobId",
        "lastError",
        "createdAt",
        "updatedAt"
      )
      VALUES (${job.groupId}, 'PROCESSING', ${job.id}, NULL, NOW(), NOW())
      ON CONFLICT ("groupId") DO UPDATE SET
        "status" = 'PROCESSING',
        "processingJobId" = ${job.id},
        "lastError" = NULL,
        "updatedAt" = NOW()
    `;

    await this.groupHomeSummary.syncGroupSummary(job.groupId);
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
