import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  MatchBody,
  MatchDeletedResponse,
  MatchResponse,
} from '@arena/contracts/matches';
import { MatchTeam } from '../generated/prisma/enums';
import {
  MEMBER_USER_SELECT,
  resolveMemberDisplayName,
} from '../common/member-display-name';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '../generated/prisma/client';
import { MembersService } from '../members/members.service';
import { ProcessingJobWriterService } from '../processing/processing-job-writer.service';

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
    private readonly members: MembersService,
    private readonly processingJobs: ProcessingJobWriterService,
  ) {}

  async create(
    groupId: string,
    userId: string,
    body: MatchBody,
  ): Promise<MatchResponse> {
    const created = await this.prisma.$transaction(async (tx) => {
      await this.ensureGroupExists(tx, groupId);
      await this.ensureActiveGroupMember(tx, groupId, userId);

      const playerIds = await this.resolvePlayerIds(tx, groupId, body);
      const membersById = await this.getMembersById(tx, groupId, playerIds);
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
                playerIds[0],
                membersById,
                MatchTeam.TEAM_A,
                1,
                playedAt,
              ),
              this.buildPlayerCreate(
                groupId,
                playerIds[1],
                membersById,
                MatchTeam.TEAM_A,
                2,
                playedAt,
              ),
              this.buildPlayerCreate(
                groupId,
                playerIds[2],
                membersById,
                MatchTeam.TEAM_B,
                1,
                playedAt,
              ),
              this.buildPlayerCreate(
                groupId,
                playerIds[3],
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

      return tx.match.findUniqueOrThrow({
        where: { id: match.id },
        ...this.matchInclude(),
      });
    });

    // The job was written inside the transaction, where the worker's claim
    // cannot see it yet; hand off now that it has committed.
    this.processingJobs.wake();

    return created;
  }

  async update(
    groupId: string,
    id: string,
    userId: string,
    body: MatchBody,
  ): Promise<MatchResponse> {
    const updated = await this.prisma.$transaction(async (tx) => {
      await this.ensureGroupExists(tx, groupId);
      await this.ensureActiveGroupMember(tx, groupId, userId);

      const existingMatch = await this.findActiveMatchId(tx, groupId, id);

      if (!existingMatch) {
        throw new NotFoundException('Match not found');
      }

      const playerIds = await this.resolvePlayerIds(tx, groupId, body);
      const membersById = await this.getMembersById(tx, groupId, playerIds);
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
                playerIds[0],
                membersById,
                MatchTeam.TEAM_A,
                1,
                playedAt,
              ),
              this.buildPlayerCreate(
                groupId,
                playerIds[1],
                membersById,
                MatchTeam.TEAM_A,
                2,
                playedAt,
              ),
              this.buildPlayerCreate(
                groupId,
                playerIds[2],
                membersById,
                MatchTeam.TEAM_B,
                1,
                playedAt,
              ),
              this.buildPlayerCreate(
                groupId,
                playerIds[3],
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

      return tx.match.findUniqueOrThrow({
        where: { id },
        ...this.matchInclude(),
      });
    });

    this.processingJobs.wake();

    return updated;
  }

  async remove(
    groupId: string,
    id: string,
    userId: string,
  ): Promise<MatchDeletedResponse> {
    const removed = await this.prisma.$transaction(async (tx) => {
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

    this.processingJobs.wake();

    return removed;
  }

  async findAll(groupId: string): Promise<MatchResponse[]> {
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
      ...this.matchInclude(),
    });
  }

  async findOne(groupId: string, id: string): Promise<MatchResponse> {
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
      ...this.matchInclude(),
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    return match;
  }

  // Turns the four player slots into four group-member ids, creating a stub row
  // for any slot that named a new guest. Runs inside the match transaction, so a
  // failure anywhere downstream rolls the stubs back — they never outlive an
  // unregistered match. Sequential on purpose: parallel writes on one tx client
  // are unsafe.
  private async resolvePlayerIds(
    tx: Prisma.TransactionClient,
    groupId: string,
    body: MatchBody,
  ): Promise<string[]> {
    const slots = [
      body.teamAPlayer1,
      body.teamAPlayer2,
      body.teamBPlayer1,
      body.teamBPlayer2,
    ];

    const ids: string[] = [];

    for (const slot of slots) {
      if ('memberId' in slot) {
        ids.push(slot.memberId);
      } else {
        ids.push(await this.members.createGuestRow(tx, groupId, slot.name));
      }
    }

    if (new Set(ids).size !== 4) {
      throw new BadRequestException('A player cannot appear twice in a match');
    }

    return ids;
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
    memberIds: string[],
  ) {
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

  // The contract guarantees ISO 8601, so the parse cannot fail.
  private parsePlayedAt(playedAt?: string) {
    return playedAt ? new Date(playedAt) : new Date();
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

  // Shapes the response to `matchResponseSchema`: processing internals stay
  // server-side and each player's member is identity only (the ratings that
  // matter here are the MatchPlayer snapshot). `GET /groups/:id/matches` has no
  // guard, so anything selected here is public.
  private matchInclude() {
    return {
      omit: {
        processedAt: true,
        processingError: true,
        deletedAt: true,
      },
      include: {
        players: {
          orderBy: [{ team: 'asc' as const }, { position: 'asc' as const }],
          include: {
            groupMember: {
              select: {
                id: true,
                userId: true,
                displayName: true,
                user: { select: MEMBER_USER_SELECT },
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
