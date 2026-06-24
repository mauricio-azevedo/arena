import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MatchTeam } from '../generated/prisma/enums';
import {
  MEMBER_USER_SELECT,
  resolveMemberDisplayName,
} from '../common/member-display-name';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '../generated/prisma/client';
import { ProcessingJobWriterService } from '../processing/processing-job-writer.service';

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
  userId: string | null;
  displayName: string;
};

type MatchIdRow = {
  id: string;
};

type PrismaClientLike = Prisma.TransactionClient | PrismaService;

const RATING_ALGORITHM = 'BEACH_ELO_V1';

@Injectable()
export class MatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly processingJobs: ProcessingJobWriterService,
  ) {}

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
          teamAExpected: null,
          teamBExpected: null,
          teamAActual: null,
          teamBActual: null,
          teamARatingBefore: null,
          teamBRatingBefore: null,
          teamARatingAfter: null,
          teamBRatingAfter: null,
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

      await this.markMatchPending(tx, match.id, groupId);
      await this.processingJobs.enqueueGroupJob(
        {
          type: 'MATCH_CREATED',
          groupId,
          matchId: match.id,
        },
        tx,
      );

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
      await this.ensureActiveGroupMember(tx, groupId, userId);

      const existingMatch = await this.findActiveMatchId(tx, groupId, id);

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

      await this.markMatchPending(tx, id, groupId);
      await this.processingJobs.enqueueGroupJob(
        {
          type: 'MATCH_UPDATED',
          groupId,
          matchId: id,
        },
        tx,
      );

      return tx.match.findUnique({
        where: { id },
        include: this.matchInclude(),
      });
    });
  }

  async remove(groupId: string, id: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.ensureGroupExists(tx, groupId);
      await this.ensureActiveGroupMember(tx, groupId, userId);

      const existingMatch = await this.findActiveMatchId(tx, groupId, id);

      if (!existingMatch) {
        throw new NotFoundException('Match not found');
      }

      await tx.$executeRaw`
        UPDATE "Match"
        SET
          "deletedAt" = NOW(),
          "processingStatus" = 'PENDING',
          "processedAt" = NULL,
          "processingError" = NULL
        WHERE "id" = ${id}
          AND "groupId" = ${groupId}
      `;

      await this.processingJobs.enqueueGroupJob(
        {
          type: 'MATCH_DELETED',
          groupId,
          matchId: id,
          payload: { reason: 'MATCH_DELETED', deletedMatchId: id },
        },
        tx,
      );

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

    const activeMatchIds = await this.findActiveMatchIds(this.prisma, groupId);

    if (activeMatchIds.length === 0) {
      return [];
    }

    return this.prisma.match.findMany({
      where: {
        id: { in: activeMatchIds.map((match) => match.id) },
      },
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

    const activeMatch = await this.findActiveMatchId(this.prisma, groupId, id);

    if (!activeMatch) {
      throw new NotFoundException('Match not found');
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
        user: {
          select: {
            ...MEMBER_USER_SELECT,
          },
        },
      },
    });

    if (members.length !== 4) {
      throw new NotFoundException(
        'One or more members were not found in this group',
      );
    }

    return new Map(
      members.map((member) => [
        member.id,
        {
          id: member.id,
          userId: member.userId,
          displayName: resolveMemberDisplayName(member),
        },
      ]),
    );
  }

  private buildPlayerCreate(
    groupId: string,
    groupMemberId: string,
    membersById: Map<string, MatchMember>,
    team: MatchTeam,
    position: number,
    playedAt: Date,
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

  private async markMatchPending(
    tx: Prisma.TransactionClient,
    matchId: string,
    groupId: string,
  ) {
    await tx.$executeRaw`
      UPDATE "Match"
      SET
        "processingStatus" = 'PENDING',
        "processedAt" = NULL,
        "processingError" = NULL,
        "deletedAt" = NULL
      WHERE "id" = ${matchId}
        AND "groupId" = ${groupId}
    `;
  }

  private async findActiveMatchIds(tx: PrismaClientLike, groupId: string) {
    return tx.$queryRaw<MatchIdRow[]>`
      SELECT "id"
      FROM "Match"
      WHERE "groupId" = ${groupId}
        AND "deletedAt" IS NULL
      ORDER BY "playedAt" DESC, "createdAt" DESC
    `;
  }

  private async findActiveMatchId(
    tx: PrismaClientLike,
    groupId: string,
    matchId: string,
  ) {
    const matches = await tx.$queryRaw<MatchIdRow[]>`
      SELECT "id"
      FROM "Match"
      WHERE "id" = ${matchId}
        AND "groupId" = ${groupId}
        AND "deletedAt" IS NULL
      LIMIT 1
    `;

    return matches[0] ?? null;
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
                  ...MEMBER_USER_SELECT,
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
