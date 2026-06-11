import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FeedOrchestratorService } from '../feed/feed-orchestrator.service';
import type {
  RankingMovementFeedAffectedMember,
  RankingMovementFeedInput,
  RankingMovementFeedMovement,
  RankingMovementFeedPlayer,
} from '../feed/types/ranking-movement-feed-input.type';
import { RankingMovementService } from '../ranking/ranking-movement.service';
import { MatchTeam } from '../generated/prisma/enums';
import { errorLogFields, structuredLog } from '../observability/structured-log';
import type { ProcessingJob } from './processing-job.types';

const DEFAULT_LOCK_TIMEOUT_MS = 60_000;
const DEFAULT_TRANSACTION_TIMEOUT_MS = 15_000;
const RANKING_MOVEMENT_FEED_THRESHOLD = 2;

type PrismaClientLike = Prisma.TransactionClient | PrismaService;

type MatchMember = {
  id: string;
  userId: string;
  displayName: string;
};

type RankingMovementProjectionRow = {
  id: string;
  groupId: string;
  groupMemberId: string;
  matchId: string;
  direction: 'UP' | 'DOWN';
  positions: number;
  previousRank: number;
  currentRank: number;
  previousRating: number;
  currentRating: number;
  passedGroupMemberIds: unknown;
  occurredAt: Date;
  groupMember: {
    userId: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  match: {
    id: string;
    groupId: string;
    winnerTeam: MatchTeam | null;
    gamesA: number;
    gamesB: number;
    playedAt: Date;
    players: Array<{
      groupMemberId: string;
      team: MatchTeam;
      position: number;
      groupMember: {
        userId: string;
        user: {
          firstName: string;
          lastName: string;
        };
      };
    }>;
  };
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

    switch (job.type) {
      case 'MATCH_CREATED':
      case 'MATCH_UPDATED':
        await this.processMatchChangedJob(job);
        break;
      case 'MATCH_DELETED':
      case 'GROUP_RANKING_REBUILD':
        await this.processGroupRankingRebuildJob(job.groupId);
        break;
      default:
        throw new Error(`Unsupported processing job type: ${job.type}`);
    }
  }

  private async processGroupRankingRebuildJob(groupId: string) {
    await this.prisma.$transaction(
      (tx) => this.rankingMovements.syncGroupRankingState(tx, groupId),
      { timeout: this.getTransactionTimeoutMs() },
    );

    await this.prisma.$transaction(
      (tx) => this.syncGroupRankingMovementFeedItems(tx, groupId),
      { timeout: this.getTransactionTimeoutMs() },
    );
  }

  private async processMatchChangedJob(job: ProcessingJob) {
    if (!job.matchId) {
      throw new Error('Match processing job requires matchId');
    }

    const canProcessIncrementally = await this.isLatestMatch(this.prisma, job.groupId, job.matchId);

    this.logger.log(
      structuredLog('processing_job.match_projection_strategy_selected', {
        jobId: job.id,
        jobType: job.type,
        groupId: job.groupId,
        matchId: job.matchId,
        strategy: canProcessIncrementally && job.type === 'MATCH_CREATED' ? 'incremental' : 'full_rebuild',
      }),
    );

    await this.prisma.$transaction(
      async (tx) => {
        if (canProcessIncrementally && job.type === 'MATCH_CREATED') {
          await this.rankingMovements.syncLatestMatchRankingState(tx, job.groupId, job.matchId!);
        } else {
          await this.rankingMovements.syncGroupRankingState(tx, job.groupId);
        }
      },
      { timeout: this.getTransactionTimeoutMs() },
    );

    await this.prisma.$transaction(
      async (tx) => {
        await this.syncMatchFeedItems(tx, job.groupId, job.matchId!);
        await this.syncGroupRankingMovementFeedItems(tx, job.groupId);
      },
      { timeout: this.getTransactionTimeoutMs() },
    );
  }

  private async isLatestMatch(
    tx: PrismaClientLike,
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
    const visibleMovements = (await tx.rankingMovement.findMany({
      where: {
        groupId,
        isVisible: true,
        invalidatedAt: null,
        OR: [
          {
            positions: {
              gte: RANKING_MOVEMENT_FEED_THRESHOLD,
            },
          },
          {
            direction: 'UP',
            currentRank: 1,
          },
          {
            direction: 'DOWN',
            previousRank: 1,
          },
        ],
      },
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
        match: {
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
        },
      },
      orderBy: [{ occurredAt: 'asc' }, { createdAt: 'asc' }],
    })) as RankingMovementProjectionRow[];

    if (visibleMovements.length === 0) {
      return [];
    }

    const currentLeaders = await this.getCurrentLeaders(tx, groupId);
    const membersById = await this.buildRankingMovementMemberMap(tx, groupId, visibleMovements);
    const movementsByMatchId = new Map<string, RankingMovementProjectionRow[]>();

    for (const movement of visibleMovements) {
      const movements = movementsByMatchId.get(movement.matchId) ?? [];
      movements.push(movement);
      movementsByMatchId.set(movement.matchId, movements);
    }

    return [...movementsByMatchId.values()]
      .map((movements) => this.buildRankingMovementFeedInput(movements, membersById, currentLeaders))
      .filter((input): input is RankingMovementFeedInput => Boolean(input));
  }

  private async getCurrentLeaders(tx: Prisma.TransactionClient, groupId: string) {
    const leaders = await tx.groupMember.findMany({
      where: {
        groupId,
        leftAt: null,
        currentRank: 1,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [{ rating: 'desc' }, { createdAt: 'asc' }],
    });

    return leaders.map((leader) => this.getRankingMovementFeedPlayer({
      groupMemberId: leader.id,
      userId: leader.userId,
      user: leader.user,
    }));
  }

  private async buildRankingMovementMemberMap(
    tx: Prisma.TransactionClient,
    groupId: string,
    movements: RankingMovementProjectionRow[],
  ) {
    const groupMemberIds = new Set<string>();

    for (const movement of movements) {
      groupMemberIds.add(movement.groupMemberId);

      for (const affectedMemberId of this.getAffectedGroupMemberIds(movement.passedGroupMemberIds)) {
        groupMemberIds.add(affectedMemberId);
      }

      for (const player of movement.match.players) {
        groupMemberIds.add(player.groupMemberId);
      }
    }

    const members = await tx.groupMember.findMany({
      where: {
        groupId,
        id: {
          in: [...groupMemberIds],
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return new Map(
      members.map((member) => [
        member.id,
        {
          groupMemberId: member.id,
          userId: member.userId,
          displayName: this.getUserDisplayName(member.user),
          rank: member.currentRank ?? null,
        },
      ]),
    );
  }

  private buildRankingMovementFeedInput(
    movements: RankingMovementProjectionRow[],
    membersById: Map<string, RankingMovementFeedAffectedMember>,
    currentLeaders: RankingMovementFeedPlayer[],
  ): RankingMovementFeedInput | null {
    const firstMovement = movements[0];
    const match = firstMovement?.match;

    if (!firstMovement || !match?.winnerTeam) {
      return null;
    }

    const teamA = this.getRankingMovementMatchTeam(match.players, MatchTeam.TEAM_A, membersById);
    const teamB = this.getRankingMovementMatchTeam(match.players, MatchTeam.TEAM_B, membersById);

    if (teamA.length !== 2 || teamB.length !== 2) {
      return null;
    }

    const feedMovements = movements.map((movement) => this.getRankingMovementFeedMovement(movement, membersById));

    return {
      groupId: firstMovement.groupId,
      matchId: firstMovement.matchId,
      winnerTeam: match.winnerTeam,
      gamesA: match.gamesA,
      gamesB: match.gamesB,
      winners: match.winnerTeam === MatchTeam.TEAM_A ? teamA : teamB,
      losers: match.winnerTeam === MatchTeam.TEAM_A ? teamB : teamA,
      movements: feedMovements,
      leadershipChange: this.getLeadershipChange(feedMovements, currentLeaders),
      occurredAt: match.playedAt,
    };
  }

  private getRankingMovementFeedMovement(
    movement: RankingMovementProjectionRow,
    membersById: Map<string, RankingMovementFeedAffectedMember>,
  ): RankingMovementFeedMovement {
    const member = membersById.get(movement.groupMemberId);

    if (!member) {
      throw new Error('Ranking movement member not found');
    }

    return {
      groupMemberId: member.groupMemberId,
      userId: member.userId,
      displayName: member.displayName,
      direction: movement.direction,
      positions: movement.positions,
      previousRank: movement.previousRank,
      currentRank: movement.currentRank,
      previousRating: movement.previousRating,
      currentRating: movement.currentRating,
      affectedMembers: this.getAffectedGroupMemberIds(movement.passedGroupMemberIds)
        .map((groupMemberId) => membersById.get(groupMemberId))
        .filter((member): member is RankingMovementFeedAffectedMember => Boolean(member)),
    };
  }

  private getLeadershipChange(
    movements: RankingMovementFeedMovement[],
    currentLeaders: RankingMovementFeedPlayer[],
  ) {
    const upToLeadership = movements.filter(
      (movement) => movement.direction === 'UP' && movement.currentRank === 1,
    );
    const dethronedLeaders = movements.filter(
      (movement) => movement.direction === 'DOWN' && movement.previousRank === 1,
    );

    if (upToLeadership.length === 0 && dethronedLeaders.length === 0) {
      return null;
    }

    const previousLeaderMap = new Map<string, RankingMovementFeedPlayer>();

    for (const movement of dethronedLeaders) {
      previousLeaderMap.set(movement.groupMemberId, this.toRankingMovementFeedPlayer(movement));
    }

    for (const movement of upToLeadership) {
      for (const affectedMember of movement.affectedMembers) {
        if (affectedMember.groupMemberId !== movement.groupMemberId) {
          previousLeaderMap.set(affectedMember.groupMemberId, this.toRankingMovementFeedPlayer(affectedMember));
        }
      }
    }

    const currentLeaderMap = new Map<string, RankingMovementFeedPlayer>();
    const movedToLeadershipIds = new Set(upToLeadership.map((movement) => movement.groupMemberId));

    if (dethronedLeaders.length > 0) {
      for (const leader of currentLeaders) {
        currentLeaderMap.set(leader.groupMemberId, leader);
      }
    }

    for (const movement of upToLeadership) {
      currentLeaderMap.set(movement.groupMemberId, this.toRankingMovementFeedPlayer(movement));
    }

    return {
      previousLeaders: [...previousLeaderMap.values()],
      currentLeaders: [...currentLeaderMap.values()].filter(
        (leader) => dethronedLeaders.length > 0 || movedToLeadershipIds.has(leader.groupMemberId),
      ),
      dethronedLeaders: dethronedLeaders.map((movement) => this.toRankingMovementFeedPlayer(movement)),
    };
  }

  private getRankingMovementMatchTeam(
    players: RankingMovementProjectionRow['match']['players'],
    team: MatchTeam,
    membersById: Map<string, RankingMovementFeedAffectedMember>,
  ) {
    return players
      .filter((player) => player.team === team)
      .sort((a, b) => a.position - b.position)
      .map((player) => membersById.get(player.groupMemberId))
      .filter((player): player is RankingMovementFeedAffectedMember => Boolean(player))
      .map((player) => this.toRankingMovementFeedPlayer(player));
  }

  private getAffectedGroupMemberIds(value: unknown) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item): item is string => typeof item === 'string');
  }

  private toRankingMovementFeedPlayer(
    player: RankingMovementFeedAffectedMember | RankingMovementFeedMovement,
  ): RankingMovementFeedPlayer {
    return {
      groupMemberId: player.groupMemberId,
      userId: player.userId,
      displayName: player.displayName,
    };
  }

  private getRankingMovementFeedPlayer(input: {
    groupMemberId: string;
    userId: string;
    user: { firstName: string; lastName: string };
  }): RankingMovementFeedPlayer {
    return {
      groupMemberId: input.groupMemberId,
      userId: input.userId,
      displayName: this.getUserDisplayName(input.user),
    };
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

  private getTransactionTimeoutMs() {
    const value = Number(process.env.PROCESSING_JOB_TRANSACTION_TIMEOUT_MS);

    if (Number.isFinite(value) && value > 0) {
      return value;
    }

    return DEFAULT_TRANSACTION_TIMEOUT_MS;
  }
}
