import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MatchTeam } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { calculateBeachRating } from '../rating/calculate-beach-rating';
import type { Prisma } from '../generated/prisma/client';
import { FeedOrchestratorService } from '../feed/feed-orchestrator.service';

type MatchBody = {
  teamAPlayer1Id: string;
  teamAPlayer2Id: string;
  teamBPlayer1Id: string;
  teamBPlayer2Id: string;
  gamesA: number;
  gamesB: number;
  playedAt?: string;
};

type MatchMember = {
  id: string;
  userId: string;
  displayName: string;
  rating: number;
};

type RatingState = {
  id: string;
  name: string;
  rating: number;
};

type PlayerRatingSnapshot = {
  ratingBefore: number;
  ratingAfter: number;
  ratingDelta: number;
};

type MatchRatingSnapshot = {
  teamAExpected: number;
  teamBExpected: number;
  teamAActual: number;
  teamBActual: number;
  teamARatingBefore: number;
  teamBRatingBefore: number;
  teamARatingAfter: number;
  teamBRatingAfter: number;
  playerRatingsByMemberId: Map<string, PlayerRatingSnapshot>;
  updatedMembers: Array<{ id: string; rating: number }>;
};

const INITIAL_RATING = 1000;
const RATING_ALGORITHM = 'BEACH_ELO_V1';

@Injectable()
export class MatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feed: FeedOrchestratorService,
  ) {}

  async create(groupId: string, userId: string, body: MatchBody) {
    this.validateMatchBody(body);

    return this.prisma.$transaction(async (tx) => {
      await this.ensureGroupExists(tx, groupId);
      await this.ensureActiveGroupMember(tx, groupId, userId);

      const membersById = await this.getMembersById(tx, groupId, body);
      const playedAt = this.parsePlayedAt(body.playedAt);
      const canUseAppendOnlyRatingUpdate =
        await this.canUseAppendOnlyRatingUpdate(tx, groupId, playedAt);
      const ratingSnapshot = canUseAppendOnlyRatingUpdate
        ? this.calculateCurrentMatchRatings(body, membersById)
        : null;

      const match = await tx.match.create({
        data: {
          groupId,
          gamesA: body.gamesA,
          gamesB: body.gamesB,
          winnerTeam: this.getWinnerTeam(body),
          ratingAlgorithm: RATING_ALGORITHM,
          playedAt,
          ...(ratingSnapshot
            ? {
                teamAExpected: ratingSnapshot.teamAExpected,
                teamBExpected: ratingSnapshot.teamBExpected,
                teamAActual: ratingSnapshot.teamAActual,
                teamBActual: ratingSnapshot.teamBActual,
                teamARatingBefore: ratingSnapshot.teamARatingBefore,
                teamBRatingBefore: ratingSnapshot.teamBRatingBefore,
                teamARatingAfter: ratingSnapshot.teamARatingAfter,
                teamBRatingAfter: ratingSnapshot.teamBRatingAfter,
              }
            : {}),
          players: {
            create: [
              this.buildPlayerCreate(
                groupId,
                body.teamAPlayer1Id,
                membersById,
                MatchTeam.TEAM_A,
                1,
                playedAt,
                ratingSnapshot?.playerRatingsByMemberId.get(body.teamAPlayer1Id),
              ),
              this.buildPlayerCreate(
                groupId,
                body.teamAPlayer2Id,
                membersById,
                MatchTeam.TEAM_A,
                2,
                playedAt,
                ratingSnapshot?.playerRatingsByMemberId.get(body.teamAPlayer2Id),
              ),
              this.buildPlayerCreate(
                groupId,
                body.teamBPlayer1Id,
                membersById,
                MatchTeam.TEAM_B,
                1,
                playedAt,
                ratingSnapshot?.playerRatingsByMemberId.get(body.teamBPlayer1Id),
              ),
              this.buildPlayerCreate(
                groupId,
                body.teamBPlayer2Id,
                membersById,
                MatchTeam.TEAM_B,
                2,
                playedAt,
                ratingSnapshot?.playerRatingsByMemberId.get(body.teamBPlayer2Id),
              ),
            ],
          },
        },
      });

      if (ratingSnapshot) {
        await this.updateGroupMemberRatings(tx, ratingSnapshot.updatedMembers);
      } else {
        await this.recalculateRatings(tx, groupId);
      }

      await this.syncMatchBlowoutFeedItem(tx, groupId, match.id, body, membersById, playedAt);

      return tx.match.findUnique({
        where: { id: match.id },
        include: this.matchInclude(),
      });
    });
  }

  async update(groupId: string, id: string, userId: string, body: MatchBody) {
    this.validateMatchBody(body);

    return this.prisma.$transaction(async (tx) => {
      await this.ensureGroupExists(tx, groupId);

      const existingMatch = await tx.match.findFirst({
        where: { id, groupId },
      });

      if (!existingMatch) {
        throw new NotFoundException('Match not found');
      }

      const membersById = await this.getMembersById(tx, groupId, body);
      const playedAt = this.parsePlayedAt(body.playedAt);

      await tx.matchPlayer.deleteMany({
        where: { matchId: id, groupId },
      });

      await tx.match.update({
        where: { id },
        data: {
          gamesA: body.gamesA,
          gamesB: body.gamesB,
          winnerTeam: this.getWinnerTeam(body),
          teamAExpected: null,
          teamBExpected: null,
          teamAActual: null,
          teamBActual: null,
          teamARatingBefore: null,
          teamBRatingBefore: null,
          teamARatingAfter: null,
          teamBRatingAfter: null,
          ratingAlgorithm: RATING_ALGORITHM,
          playedAt,
          players: {
            create: [
              this.buildPlayerCreate(
                groupId,
                body.teamAPlayer1Id,
                membersById,
                MatchTeam.TEAM_A,
                1,
                playedAt,
              ),
              this.buildPlayerCreate(
                groupId,
                body.teamAPlayer2Id,
                membersById,
                MatchTeam.TEAM_A,
                2,
                playedAt,
              ),
              this.buildPlayerCreate(
                groupId,
                body.teamBPlayer1Id,
                membersById,
                MatchTeam.TEAM_B,
                1,
                playedAt,
              ),
              this.buildPlayerCreate(
                groupId,
                body.teamBPlayer2Id,
                membersById,
                MatchTeam.TEAM_B,
                2,
                playedAt,
              ),
            ],
          },
        },
      });

      await this.recalculateRatings(tx, groupId);
      await this.syncMatchBlowoutFeedItem(tx, groupId, id, body, membersById, playedAt);

      return tx.match.findUnique({
        where: { id },
        include: this.matchInclude(),
      });
    });
  }

  async remove(groupId: string, id: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.ensureGroupExists(tx, groupId);

      const existingMatch = await tx.match.findFirst({
        where: { id, groupId },
      });

      if (!existingMatch) {
        throw new NotFoundException('Match not found');
      }

      await tx.match.delete({
        where: { id },
      });

      await this.recalculateRatings(tx, groupId);

      return { success: true };
    });
  }

  async findAll(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return this.prisma.match.findMany({
      where: { groupId },
      orderBy: [{ playedAt: 'desc' }, { createdAt: 'desc' }],
      include: this.matchInclude(),
    });
  }

  async findOne(groupId: string, id: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const match = await this.prisma.match.findFirst({
      where: {
        id,
        groupId,
      },
      include: this.matchInclude(),
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    return match;
  }

  private validateMatchBody(body: MatchBody) {
    const playerIds = [
      body.teamAPlayer1Id,
      body.teamAPlayer2Id,
      body.teamBPlayer1Id,
      body.teamBPlayer2Id,
    ];

    if (playerIds.some((id) => !id)) {
      throw new BadRequestException('All members are required');
    }

    if (new Set(playerIds).size !== 4) {
      throw new BadRequestException('A player cannot appear twice in a match');
    }

    if (body.gamesA < 0 || body.gamesB < 0 || body.gamesA + body.gamesB === 0) {
      throw new BadRequestException('Invalid score');
    }

    if (body.gamesA === body.gamesB) {
      throw new BadRequestException('A match cannot end in a draw');
    }
  }

  private async ensureGroupExists(
    tx: Prisma.TransactionClient,
    groupId: string,
  ) {
    const group = await tx.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }
  }

  private async getMembersById(
    tx: Prisma.TransactionClient,
    groupId: string,
    body: MatchBody,
  ) {
    const memberIds = [
      body.teamAPlayer1Id,
      body.teamAPlayer2Id,
      body.teamBPlayer1Id,
      body.teamBPlayer2Id,
    ];

    const members = await tx.groupMember.findMany({
      where: {
        groupId,
        id: { in: memberIds },
        leftAt: null,
      },
      select: {
        id: true,
        userId: true,
        displayName: true,
        rating: true,
      },
    });

    if (members.length !== 4) {
      throw new NotFoundException(
        'One or more members were not found in this group',
      );
    }

    return new Map(members.map((member) => [member.id, member]));
  }

  private buildPlayerCreate(
    groupId: string,
    groupMemberId: string,
    membersById: Map<string, MatchMember>,
    team: MatchTeam,
    position: number,
    playedAt: Date,
    ratingSnapshot?: PlayerRatingSnapshot,
  ) {
    const member = membersById.get(groupMemberId);

    if (!member) {
      throw new NotFoundException(
        'One or more members were not found in this group',
      );
    }

    return {
      groupMember: {
        connect: {
          id_groupId: {
            id: groupMemberId,
            groupId,
          },
        },
      },
      displayNameSnapshot: member.displayName,
      team,
      position,
      ratingBefore: ratingSnapshot?.ratingBefore ?? 0,
      ratingAfter: ratingSnapshot?.ratingAfter ?? 0,
      ratingDelta: ratingSnapshot?.ratingDelta ?? 0,
      playedAt,
    };
  }

  private parsePlayedAt(playedAt?: string) {
    if (!playedAt) {
      return new Date();
    }

    const date = new Date(playedAt);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid playedAt');
    }

    return date;
  }

  private getWinnerTeam(body: MatchBody) {
    return body.gamesA > body.gamesB ? MatchTeam.TEAM_A : MatchTeam.TEAM_B;
  }

  private syncMatchBlowoutFeedItem(
    tx: Prisma.TransactionClient,
    groupId: string,
    matchId: string,
    body: MatchBody,
    membersById: Map<string, MatchMember>,
    playedAt: Date,
  ) {
    const winnerTeam = this.getWinnerTeam(body);
    const teamA = [body.teamAPlayer1Id, body.teamAPlayer2Id].map((id) =>
      this.getMatchBlowoutFeedPlayer(id, membersById),
    );
    const teamB = [body.teamBPlayer1Id, body.teamBPlayer2Id].map((id) =>
      this.getMatchBlowoutFeedPlayer(id, membersById),
    );

    return this.feed.syncMatchBlowoutItem(
      {
        groupId,
        matchId,
        winnerTeam,
        gamesA: body.gamesA,
        gamesB: body.gamesB,
        winners: winnerTeam === MatchTeam.TEAM_A ? teamA : teamB,
        losers: winnerTeam === MatchTeam.TEAM_A ? teamB : teamA,
        occurredAt: playedAt,
      },
      tx,
    );
  }

  private getMatchBlowoutFeedPlayer(
    groupMemberId: string,
    membersById: Map<string, MatchMember>,
  ) {
    const member = membersById.get(groupMemberId);

    if (!member) {
      throw new NotFoundException(
        'One or more members were not found in this group',
      );
    }

    return {
      groupMemberId: member.id,
      userId: member.userId,
      displayName: member.displayName,
    };
  }

  private async canUseAppendOnlyRatingUpdate(
    tx: Prisma.TransactionClient,
    groupId: string,
    playedAt: Date,
  ) {
    const latestMatch = await tx.match.findFirst({
      where: { groupId },
      orderBy: [{ playedAt: 'desc' }, { createdAt: 'desc' }],
      select: { playedAt: true },
    });

    if (!latestMatch) {
      return true;
    }

    return playedAt.getTime() >= latestMatch.playedAt.getTime();
  }

  private calculateCurrentMatchRatings(
    body: MatchBody,
    membersById: Map<string, MatchMember>,
  ): MatchRatingSnapshot {
    const teamAPlayer1 = this.getRatingState(body.teamAPlayer1Id, membersById);
    const teamAPlayer2 = this.getRatingState(body.teamAPlayer2Id, membersById);
    const teamBPlayer1 = this.getRatingState(body.teamBPlayer1Id, membersById);
    const teamBPlayer2 = this.getRatingState(body.teamBPlayer2Id, membersById);

    const teamARatingBefore = (teamAPlayer1.rating + teamAPlayer2.rating) / 2;
    const teamBRatingBefore = (teamBPlayer1.rating + teamBPlayer2.rating) / 2;

    const result = calculateBeachRating({
      teamA: [teamAPlayer1, teamAPlayer2],
      teamB: [teamBPlayer1, teamBPlayer2],
      gamesA: body.gamesA,
      gamesB: body.gamesB,
    });

    const updatedPlayers = [...result.teamA.players, ...result.teamB.players];
    const playersBeforeById = new Map(
      [teamAPlayer1, teamAPlayer2, teamBPlayer1, teamBPlayer2].map((player) => [
        player.id,
        player.rating,
      ]),
    );
    const playerRatingsByMemberId = new Map<string, PlayerRatingSnapshot>();

    for (const player of updatedPlayers) {
      const ratingBefore = playersBeforeById.get(player.id);

      if (ratingBefore === undefined) {
        throw new Error('Invalid updated player');
      }

      playerRatingsByMemberId.set(player.id, {
        ratingBefore,
        ratingAfter: player.newRating,
        ratingDelta: player.newRating - ratingBefore,
      });
    }

    return {
      teamAExpected: result.teamA.expected,
      teamBExpected: result.teamB.expected,
      teamAActual: result.teamA.actual,
      teamBActual: result.teamB.actual,
      teamARatingBefore,
      teamBRatingBefore,
      teamARatingAfter:
        (result.teamA.players[0].newRating + result.teamA.players[1].newRating) /
        2,
      teamBRatingAfter:
        (result.teamB.players[0].newRating + result.teamB.players[1].newRating) /
        2,
      playerRatingsByMemberId,
      updatedMembers: updatedPlayers.map((player) => ({
        id: player.id,
        rating: player.newRating,
      })),
    };
  }

  private getRatingState(
    groupMemberId: string,
    membersById: Map<string, MatchMember>,
  ): RatingState {
    const member = membersById.get(groupMemberId);

    if (!member) {
      throw new NotFoundException(
        'One or more members were not found in this group',
      );
    }

    return {
      id: member.id,
      name: member.displayName,
      rating: member.rating,
    };
  }

  private async updateGroupMemberRatings(
    tx: Prisma.TransactionClient,
    members: Array<{ id: string; rating: number }>,
  ) {
    for (const member of members) {
      await tx.groupMember.update({
        where: { id: member.id },
        data: {
          rating: member.rating,
          ratingAlgorithm: RATING_ALGORITHM,
        },
      });
    }
  }

  private async recalculateRatings(
    tx: Prisma.TransactionClient,
    groupId: string,
  ) {
    const members = await tx.groupMember.findMany({
      where: { groupId },
      select: {
        id: true,
        displayName: true,
      },
    });

    const membersById = new Map<string, RatingState>(
      members.map((member) => [
        member.id,
        {
          id: member.id,
          name: member.displayName,
          rating: INITIAL_RATING,
        },
      ]),
    );

    const matches = await tx.match.findMany({
      where: { groupId },
      orderBy: [{ playedAt: 'asc' }, { createdAt: 'asc' }],
      include: {
        players: {
          orderBy: [{ team: 'asc' }, { position: 'asc' }],
        },
      },
    });

    for (const match of matches) {
      const teamAPlayers = match.players
        .filter((player) => player.team === MatchTeam.TEAM_A)
        .sort((a, b) => a.position - b.position);

      const teamBPlayers = match.players
        .filter((player) => player.team === MatchTeam.TEAM_B)
        .sort((a, b) => a.position - b.position);

      if (teamAPlayers.length !== 2 || teamBPlayers.length !== 2) {
        throw new Error('Invalid match players');
      }

      const teamAPlayer1 = membersById.get(teamAPlayers[0].groupMemberId);
      const teamAPlayer2 = membersById.get(teamAPlayers[1].groupMemberId);
      const teamBPlayer1 = membersById.get(teamBPlayers[0].groupMemberId);
      const teamBPlayer2 = membersById.get(teamBPlayers[1].groupMemberId);

      if (!teamAPlayer1 || !teamAPlayer2 || !teamBPlayer1 || !teamBPlayer2) {
        throw new Error('Invalid match players');
      }

      const teamARatingBefore = (teamAPlayer1.rating + teamAPlayer2.rating) / 2;
      const teamBRatingBefore = (teamBPlayer1.rating + teamBPlayer2.rating) / 2;

      const result = calculateBeachRating({
        teamA: [teamAPlayer1, teamAPlayer2],
        teamB: [teamBPlayer1, teamBPlayer2],
        gamesA: match.gamesA,
        gamesB: match.gamesB,
      });

      const updatedPlayers = [...result.teamA.players, ...result.teamB.players];

      for (const player of updatedPlayers) {
        membersById.set(player.id, {
          id: player.id,
          name: player.name,
          rating: player.newRating,
        });
      }

      const playerById = new Map(
        updatedPlayers.map((player) => [player.id, player]),
      );

      for (const player of match.players) {
        const before = this.getPlayerBeforeRating(
          player.groupMemberId,
          teamAPlayers,
          teamBPlayers,
          teamAPlayer1,
          teamAPlayer2,
          teamBPlayer1,
          teamBPlayer2,
        );

        const updatedPlayer = playerById.get(player.groupMemberId);

        if (!updatedPlayer) {
          throw new Error('Invalid updated player');
        }

        await tx.matchPlayer.update({
          where: { id: player.id },
          data: {
            ratingBefore: before,
            ratingAfter: updatedPlayer.newRating,
            ratingDelta: updatedPlayer.newRating - before,
            playedAt: match.playedAt,
          },
        });
      }

      const teamARatingAfter =
        (result.teamA.players[0].newRating +
          result.teamA.players[1].newRating) /
        2;
      const teamBRatingAfter =
        (result.teamB.players[0].newRating +
          result.teamB.players[1].newRating) /
        2;

      await tx.match.update({
        where: { id: match.id },
        data: {
          winnerTeam:
            match.gamesA > match.gamesB ? MatchTeam.TEAM_A : MatchTeam.TEAM_B,
          teamAExpected: result.teamA.expected,
          teamBExpected: result.teamB.expected,
          teamAActual: result.teamA.actual,
          teamBActual: result.teamB.actual,
          teamARatingBefore,
          teamBRatingBefore,
          teamARatingAfter,
          teamBRatingAfter,
          ratingAlgorithm: RATING_ALGORITHM,
        },
      });
    }

    for (const member of membersById.values()) {
      await tx.groupMember.update({
        where: { id: member.id },
        data: {
          rating: member.rating,
          ratingAlgorithm: RATING_ALGORITHM,
        },
      });
    }
  }

  private getPlayerBeforeRating(
    groupMemberId: string,
    teamAPlayers: { groupMemberId: string }[],
    teamBPlayers: { groupMemberId: string }[],
    teamAPlayer1: RatingState,
    teamAPlayer2: RatingState,
    teamBPlayer1: RatingState,
    teamBPlayer2: RatingState,
  ) {
    if (groupMemberId === teamAPlayers[0].groupMemberId) {
      return teamAPlayer1.rating;
    }

    if (groupMemberId === teamAPlayers[1].groupMemberId) {
      return teamAPlayer2.rating;
    }

    if (groupMemberId === teamBPlayers[0].groupMemberId) {
      return teamBPlayer1.rating;
    }

    if (groupMemberId === teamBPlayers[1].groupMemberId) {
      return teamBPlayer2.rating;
    }

    throw new Error('Invalid player');
  }

  private matchInclude() {
    return {
      players: {
        orderBy: [{ team: 'asc' as const }, { position: 'asc' as const }],
        include: {
          groupMember: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    };
  }

  private async ensureActiveGroupMember(
    tx: Prisma.TransactionClient,
    groupId: string,
    userId: string,
  ) {
    const membership = await tx.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!membership || membership.leftAt) {
      throw new ForbiddenException(
        'Only active group members can manage matches',
      );
    }

    return membership;
  }
}
