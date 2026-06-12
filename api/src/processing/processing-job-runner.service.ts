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
import { RatingProjectionService } from '../rating/rating-projection.service';
import { RankingMovementService } from '../ranking/ranking-movement.service';
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

type MatchIdRow = {
  id: string;
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

type RankingSnapshotMember = RankingMovementFeedPlayer & {
  rating: number;
  rank: number;
};

type HistoricalLeadershipContext = {
  previousLeaders: RankingMovementFeedPlayer[];
  currentLeaders: RankingMovementFeedPlayer[];
  dethronedLeaders: RankingMovementFeedPlayer[];
};

@Injectable()
export class ProcessingJobRunnerService {
  private readonly logger = new Logger(ProcessingJobRunnerService.name);
  private readonly workerId = `api-${process.pid}-${randomUUID()}`;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ratingProjection: RatingProjectionService,
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

        if (changedMatchId && deleteChangedMatchFeed) {
          await this.deleteMatchFeedItems(tx, groupId, changedMatchId);
        } else if (changedMatchId) {
          await this.syncMatchFeedItems(tx, groupId, changedMatchId);
        }

        await this.syncGroupRankingMovementFeedItems(tx, groupId);
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
    const historicalMovements = (await tx.rankingMovement.findMany({
      where: {
        groupId,
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

    if (historicalMovements.length === 0) {
      return [];
    }

    const leadershipContexts = await this.buildHistoricalLeadershipContexts(tx, groupId);
    const membersById = await this.buildRankingMovementMemberMap(tx, groupId, historicalMovements);
    const movementsByMatchId = new Map<string, RankingMovementProjectionRow[]>();

    for (const movement of historicalMovements) {
      const movements = movementsByMatchId.get(movement.matchId) ?? [];
      movements.push(movement);
      movementsByMatchId.set(movement.matchId, movements);
    }

    return [...movementsByMatchId.values()]
      .map((movements) =>
        this.buildRankingMovementFeedInput(
          movements,
          membersById,
          leadershipContexts.get(movements[0].matchId) ?? null,
        ),
      )
      .filter((input): input is RankingMovementFeedInput => Boolean(input));
  }

  private async buildHistoricalLeadershipContexts(
    tx: Prisma.TransactionClient,
    groupId: string,
  ) {
    const members = await tx.groupMember.findMany({
      where: { groupId, leftAt: null },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    const playersByMemberId = new Map(
      members.map((member) => [
        member.id,
        {
          groupMemberId: member.id,
          userId: member.userId,
          displayName: this.getUserDisplayName(member.user),
        },
      ]),
    );
    const ratingByMemberId = new Map(members.map((member) => [member.id, 1000]));
    const activeMatchIds = await tx.$queryRaw<MatchIdRow[]>`
      SELECT "id"
      FROM "Match"
      WHERE "groupId" = ${groupId}
        AND "deletedAt" IS NULL
      ORDER BY "playedAt" ASC, "createdAt" ASC
    `;

    if (activeMatchIds.length === 0) {
      return new Map<string, HistoricalLeadershipContext>();
    }

    const matches = await tx.match.findMany({
      where: {
        id: {
          in: activeMatchIds.map((match) => match.id),
        },
      },
      orderBy: [{ playedAt: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        players: {
          select: {
            groupMemberId: true,
            ratingAfter: true,
          },
        },
      },
    });
    const contextsByMatchId = new Map<string, HistoricalLeadershipContext>();

    for (const match of matches) {
      const previousRanking = this.buildHistoricalRanking(playersByMemberId, ratingByMemberId);

      for (const player of match.players) {
        if (ratingByMemberId.has(player.groupMemberId)) {
          ratingByMemberId.set(player.groupMemberId, player.ratingAfter);
        }
      }

      const currentRanking = this.buildHistoricalRanking(playersByMemberId, ratingByMemberId);
      const previousLeaders = this.getSnapshotLeaders(previousRanking);
      const currentLeaders = this.getSnapshotLeaders(currentRanking);
      const dethronedLeaders = previousLeaders.filter((leader) => {
        const currentMember = currentRanking.get(leader.groupMemberId);
        return currentMember?.rank !== 1;
      });

      contextsByMatchId.set(match.id, {
        previousLeaders,
        currentLeaders,
        dethronedLeaders,
      });
    }

    return contextsByMatchId;
  }

  private buildHistoricalRanking(
    playersByMemberId: Map<string, RankingMovementFeedPlayer>,
    ratingByMemberId: Map<string, number>,
  ) {
    const sortedMembers = [...ratingByMemberId.entries()]
      .map(([groupMemberId, rating]) => ({
        ...playersByMemberId.get(groupMemberId),
        groupMemberId,
        rating,
      }))
      .filter((member): member is RankingMovementFeedPlayer & { rating: number } =>
        Boolean(member.userId && member.displayName),
      )
      .sort((a, b) => {
        const ratingComparison = b.rating - a.rating;

        if (ratingComparison !== 0) {
          return ratingComparison;
        }

        return a.groupMemberId.localeCompare(b.groupMemberId);
      });
    const rankingByMemberId = new Map<string, RankingSnapshotMember>();
    let currentRank = 0;
    let previousRating: number | null = null;

    for (const member of sortedMembers) {
      if (previousRating === null || member.rating !== previousRating) {
        currentRank += 1;
        previousRating = member.rating;
      }

      rankingByMemberId.set(member.groupMemberId, {
        groupMemberId: member.groupMemberId,
        userId: member.userId,
        displayName: member.displayName,
        rating: member.rating,
        rank: currentRank,
      });
    }

    return rankingByMemberId;
  }

  private getSnapshotLeaders(ranking: Map<string, RankingSnapshotMember>) {
    return [...ranking.values()]
      .filter((member) => member.rank === 1)
      .map((member) => this.toRankingMovementFeedPlayer(member));
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
          rank: null,
        },
      ]),
    );
  }

  private buildRankingMovementFeedInput(
    movements: RankingMovementProjectionRow[],
    membersById: Map<string, RankingMovementFeedAffectedMember>,
    leadershipContext: HistoricalLeadershipContext | null,
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
      leadershipChange: this.getLeadershipChange(feedMovements, leadershipContext),
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
    leadershipContext: HistoricalLeadershipContext | null,
  ) {
    const upToLeadership = movements.filter(
      (movement) => movement.direction === 'UP' && movement.currentRank === 1,
    );
    const dethronedLeaderMovements = movements.filter(
      (movement) => movement.direction === 'DOWN' && movement.previousRank === 1,
    );

    if (upToLeadership.length === 0 && dethronedLeaderMovements.length === 0) {
      return null;
    }

    const previousLeaderMap = new Map<string, RankingMovementFeedPlayer>();
    const currentLeaderMap = new Map<string, RankingMovementFeedPlayer>();
    const dethronedLeaderMap = new Map<string, RankingMovementFeedPlayer>();

    for (const leader of leadershipContext?.previousLeaders ?? []) {
      previousLeaderMap.set(leader.groupMemberId, leader);
    }

    for (const movement of upToLeadership) {
      currentLeaderMap.set(movement.groupMemberId, this.toRankingMovementFeedPlayer(movement));

      for (const affectedMember of movement.affectedMembers) {
        previousLeaderMap.set(affectedMember.groupMemberId, this.toRankingMovementFeedPlayer(affectedMember));
      }
    }

    for (const movement of dethronedLeaderMovements) {
      const dethronedLeader = this.toRankingMovementFeedPlayer(movement);
      previousLeaderMap.set(movement.groupMemberId, dethronedLeader);
      dethronedLeaderMap.set(movement.groupMemberId, dethronedLeader);
    }

    if (dethronedLeaderMovements.length > 0) {
      for (const leader of leadershipContext?.currentLeaders ?? []) {
        if (!dethronedLeaderMap.has(leader.groupMemberId)) {
          currentLeaderMap.set(leader.groupMemberId, leader);
        }
      }
    }

    if (dethronedLeaderMovements.length > 0 && currentLeaderMap.size === 0) {
      for (const movement of dethronedLeaderMovements) {
        const likelyHistoricalLeader = movement.affectedMembers.find(
          (member) => !previousLeaderMap.has(member.groupMemberId),
        );

        if (likelyHistoricalLeader) {
          currentLeaderMap.set(
            likelyHistoricalLeader.groupMemberId,
            this.toRankingMovementFeedPlayer(likelyHistoricalLeader),
          );
        }
      }
    }

    return {
      previousLeaders: [...previousLeaderMap.values()],
      currentLeaders: [...currentLeaderMap.values()],
      dethronedLeaders:
        dethronedLeaderMap.size > 0
          ? [...dethronedLeaderMap.values()]
          : leadershipContext?.dethronedLeaders ?? [],
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
    player: RankingMovementFeedAffectedMember | RankingMovementFeedMovement | RankingSnapshotMember,
  ): RankingMovementFeedPlayer {
    return {
      groupMemberId: player.groupMemberId,
      userId: player.userId,
      displayName: player.displayName,
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
      await this.markMatchFailed(job, message);
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
