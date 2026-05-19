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

type MatchBody = {
  teamAPlayer1Id: string;
  teamAPlayer2Id: string;
  teamBPlayer1Id: string;
  teamBPlayer2Id: string;
  gamesA: number;
  gamesB: number;
  playedAt?: string;
};

type RatingState = {
  id: string;
  name: string;
  rating: number;
};

const INITIAL_RATING = 1000;
const RATING_ALGORITHM = 'BEACH_ELO_V1';

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(groupId: string, userId: string, body: MatchBody) {
    this.validateMatchBody(body);

    return this.prisma.$transaction(async (tx) => {
      await this.ensureGroupExists(tx, groupId);
      await this.ensureActiveGroupMember(tx, groupId, userId);

      const membersById = await this.getMembersById(tx, groupId, body);
      const playedAt = this.parsePlayedAt(body.playedAt);

      const match = await tx.match.create({
        data: {
          groupId,
          gamesA: body.gamesA,
          gamesB: body.gamesB,
          winnerTeam: this.getWinnerTeam(body),
          ratingAlgorithm: RATING_ALGORITHM,
          playedAt,
          participants: {
            create: [
              this.buildParticipantCreate(
                groupId,
                body.teamAPlayer1Id,
                membersById,
                MatchTeam.TEAM_A,
                1,
                playedAt,
              ),
              this.buildParticipantCreate(
                groupId,
                body.teamAPlayer2Id,
                membersById,
                MatchTeam.TEAM_A,
                2,
                playedAt,
              ),
              this.buildParticipantCreate(
                groupId,
                body.teamBPlayer1Id,
                membersById,
                MatchTeam.TEAM_B,
                1,
                playedAt,
              ),
              this.buildParticipantCreate(
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

      await tx.matchParticipant.deleteMany({
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
          participants: {
            create: [
              this.buildParticipantCreate(
                groupId,
                body.teamAPlayer1Id,
                membersById,
                MatchTeam.TEAM_A,
                1,
                playedAt,
              ),
              this.buildParticipantCreate(
                groupId,
                body.teamAPlayer2Id,
                membersById,
                MatchTeam.TEAM_A,
                2,
                playedAt,
              ),
              this.buildParticipantCreate(
                groupId,
                body.teamBPlayer1Id,
                membersById,
                MatchTeam.TEAM_B,
                1,
                playedAt,
              ),
              this.buildParticipantCreate(
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

  private validateMatchBody(body: MatchBody) {
    const playerIds = [
      body.teamAPlayer1Id,
      body.teamAPlayer2Id,
      body.teamBPlayer1Id,
      body.teamBPlayer2Id,
    ];

    if (playerIds.some((id) => !id)) {
      throw new BadRequestException('All players are required');
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
        displayName: true,
        rating: true,
      },
    });

    if (members.length !== 4) {
      throw new NotFoundException(
        'One or more players were not found in this group',
      );
    }

    return new Map(members.map((member) => [member.id, member]));
  }

  private buildParticipantCreate(
    groupId: string,
    groupMemberId: string,
    membersById: Map<
      string,
      { id: string; displayName: string; rating: number }
    >,
    team: MatchTeam,
    position: number,
    playedAt: Date,
  ) {
    const member = membersById.get(groupMemberId);

    if (!member) {
      throw new NotFoundException(
        'One or more players were not found in this group',
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
      ratingBefore: 0,
      ratingAfter: 0,
      ratingDelta: 0,
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
        participants: {
          orderBy: [{ team: 'asc' }, { position: 'asc' }],
        },
      },
    });

    for (const match of matches) {
      const teamAParticipants = match.participants
        .filter((participant) => participant.team === MatchTeam.TEAM_A)
        .sort((a, b) => a.position - b.position);

      const teamBParticipants = match.participants
        .filter((participant) => participant.team === MatchTeam.TEAM_B)
        .sort((a, b) => a.position - b.position);

      if (teamAParticipants.length !== 2 || teamBParticipants.length !== 2) {
        throw new Error('Invalid match participants');
      }

      const teamAPlayer1 = membersById.get(teamAParticipants[0].groupMemberId);
      const teamAPlayer2 = membersById.get(teamAParticipants[1].groupMemberId);
      const teamBPlayer1 = membersById.get(teamBParticipants[0].groupMemberId);
      const teamBPlayer2 = membersById.get(teamBParticipants[1].groupMemberId);

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

      for (const participant of match.participants) {
        const before = this.getParticipantBeforeRating(
          participant.groupMemberId,
          teamAParticipants,
          teamBParticipants,
          teamAPlayer1,
          teamAPlayer2,
          teamBPlayer1,
          teamBPlayer2,
        );

        const updatedPlayer = playerById.get(participant.groupMemberId);

        if (!updatedPlayer) {
          throw new Error('Invalid updated participant');
        }

        await tx.matchParticipant.update({
          where: { id: participant.id },
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

  private getParticipantBeforeRating(
    groupMemberId: string,
    teamAParticipants: { groupMemberId: string }[],
    teamBParticipants: { groupMemberId: string }[],
    teamAPlayer1: RatingState,
    teamAPlayer2: RatingState,
    teamBPlayer1: RatingState,
    teamBPlayer2: RatingState,
  ) {
    if (groupMemberId === teamAParticipants[0].groupMemberId) {
      return teamAPlayer1.rating;
    }

    if (groupMemberId === teamAParticipants[1].groupMemberId) {
      return teamAPlayer2.rating;
    }

    if (groupMemberId === teamBParticipants[0].groupMemberId) {
      return teamBPlayer1.rating;
    }

    if (groupMemberId === teamBParticipants[1].groupMemberId) {
      return teamBPlayer2.rating;
    }

    throw new Error('Invalid participant');
  }

  private matchInclude() {
    return {
      participants: {
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
