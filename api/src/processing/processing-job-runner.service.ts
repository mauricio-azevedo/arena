import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FeedOrchestratorService } from '../feed/feed-orchestrator.service';
import { RankingMovementService } from '../ranking/ranking-movement.service';
import { MatchTeam } from '../generated/prisma/enums';
import { errorLogFields, structuredLog } from '../observability/structured-log';
import type { ProcessingJob } from './processing-job.types';

const DEFAULT_LOCK_TIMEOUT_MS = 60_000;

type MatchMember = {
  id: string;
  userId: string;
  displayName: string;
};

@Injectable()
export class ProcessingJobRunnerService {
  private readonly logger = new Logger(ProcessingJobRunnerService.name);
  private readonly workerId = `api-${process.pid}-${randomUUID()}`;

  constructor(
    private readonly prisma: PrismaService,
    private readonly rankingMovements: RankingMovementService,
    private readonly feed: FeedOrchestratorService,
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

    await this.prisma.$transaction(async (tx) => {
      switch (job.type) {
        case 'MATCH_CREATED':
        case 'MATCH_UPDATED':
          await this.processMatchChangedJob(tx, job);
          break;
        case 'MATCH_DELETED':
        case 'GROUP_RANKING_REBUILD':
          await this.rankingMovements.syncGroupRankingState(tx, job.groupId);
          break;
        default:
          throw new Error(`Unsupported processing job type: ${job.type}`);
      }
    });
  }

  private async processMatchChangedJob(
    tx: Prisma.TransactionClient,
    job: ProcessingJob,
  ) {
    if (!job.matchId) {
      throw new Error('Match processing job requires matchId');
    }

    const canProcessIncrementally = await this.isLatestMatch(tx, job.groupId, job.matchId);

    this.logger.log(
      structuredLog('processing_job.match_projection_strategy_selected', {
        jobId: job.id,
        jobType: job.type,
        groupId: job.groupId,
        matchId: job.matchId,
        strategy: canProcessIncrementally && job.type === 'MATCH_CREATED' ? 'incremental' : 'full_rebuild',
      }),
    );

    if (canProcessIncrementally && job.type === 'MATCH_CREATED') {
      await this.rankingMovements.syncLatestMatchRankingState(tx, job.groupId, job.matchId);
    } else {
      await this.rankingMovements.syncGroupRankingState(tx, job.groupId);
    }

    await this.syncMatchFeedItems(tx, job.groupId, job.matchId);
  }

  private async isLatestMatch(
    tx: Prisma.TransactionClient,
    groupId: string,
    matchId: string,
  ) {
    const latestMatch = await tx.match.findFirst({
      where: { groupId },
      orderBy: [{ playedAt: 'desc' }, { createdAt: 'desc' }],
      select: { id: true },
    });

    return latestMatch?.id === matchId;
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

  private getLockTimeoutMs() {
    const value = Number(process.env.PROCESSING_JOB_LOCK_TIMEOUT_MS);

    if (Number.isFinite(value) && value > 0) {
      return value;
    }

    return DEFAULT_LOCK_TIMEOUT_MS;
  }
}
