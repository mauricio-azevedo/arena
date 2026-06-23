import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { Prisma } from '../generated/prisma/client';
import { GroupMemberRole, MatchTeam } from '../generated/prisma/enums';
import { resolveMemberDisplayName } from '../common/member-display-name';
import { PrismaService } from '../prisma/prisma.service';
import { FeedOrchestratorService } from '../feed/feed-orchestrator.service';
import { GroupHomeSummaryService } from '../groups/group-home-summary.service';
import { ProcessingJobWriterService } from '../processing/processing-job-writer.service';
import type { ClaimStubSummary } from './types/claim-summary.type';
import type {
  ClaimAdmin,
  SharedMatch,
  SharedMatchTeam,
} from './types/accept-claim-result.type';

@Injectable()
export class GroupInvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feedOrchestrator: FeedOrchestratorService,
    private readonly groupHomeSummary: GroupHomeSummaryService,
    private readonly processingJobs: ProcessingJobWriterService,
  ) {}

  async create(
    groupId: string,
    body: {
      createdById: string;
      maxUses?: number;
      expiresAt?: string;
    },
  ) {
    if (!body.createdById) {
      throw new BadRequestException('Creator is required');
    }

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const creatorMembership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: body.createdById,
        },
      },
    });

    if (!creatorMembership || creatorMembership.leftAt) {
      throw new ForbiddenException('User is not a member of this group');
    }

    if (creatorMembership.role !== GroupMemberRole.ADMIN) {
      throw new ForbiddenException('Only group admins can create invites');
    }

    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      throw new BadRequestException('Invalid expiresAt');
    }

    if (body.maxUses !== undefined && body.maxUses <= 0) {
      throw new BadRequestException('maxUses must be greater than zero');
    }

    const token = randomBytes(24).toString('hex');

    const invite = await this.prisma.groupInvite.create({
      data: {
        groupId,
        createdById: body.createdById,
        token,
        maxUses: body.maxUses ?? null,
        expiresAt,
      },
      include: {
        group: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      ...invite,
      path: `/invites/${invite.token}`,
    };
  }

  // Generates a single-use CLAIM link for a stub player (jogador sem conta): whoever
  // opens it and signs in attaches their account to that GroupMember. Any active
  // member can create it — same low-risk bar as creating the stub.
  async createClaimLink(
    groupId: string,
    memberId: string,
    requesterUserId: string,
  ) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const requesterMembership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: requesterUserId } },
    });

    if (!requesterMembership || requesterMembership.leftAt) {
      throw new ForbiddenException('Only active group members can do this');
    }

    const member = await this.prisma.groupMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.groupId !== groupId || member.leftAt) {
      throw new NotFoundException('Member not found in this group');
    }

    if (member.userId !== null) {
      throw new BadRequestException('Este jogador já tem uma conta vinculada.');
    }

    const token = randomBytes(24).toString('hex');

    const invite = await this.prisma.groupInvite.create({
      data: {
        groupId,
        createdById: requesterUserId,
        token,
        targetGroupMemberId: memberId,
        maxUses: 1,
      },
    });

    return { ...invite, path: `/claim/${invite.token}` };
  }

  async findByToken(token: string) {
    const invite = await this.prisma.groupInvite.findUnique({
      where: { token },
      include: {
        group: {
          include: {
            _count: {
              select: {
                members: true,
                matches: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        targetGroupMember: {
          select: {
            id: true,
            userId: true,
            displayName: true,
            rating: true,
            currentRank: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.revokedAt) {
      throw new BadRequestException('Invite was revoked');
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new BadRequestException('Invite expired');
    }

    if (invite.maxUses !== null && invite.uses >= invite.maxUses) {
      throw new BadRequestException('Invite has reached the usage limit');
    }

    if (invite.targetGroupMember && invite.targetGroupMember.userId !== null) {
      throw new BadRequestException('Este perfil já foi assumido.');
    }

    return {
      ...invite,
      kind: invite.targetGroupMemberId ? ('CLAIM' as const) : ('JOIN' as const),
      targetDisplayName: invite.targetGroupMember
        ? resolveMemberDisplayName(invite.targetGroupMember)
        : null,
      stub: invite.targetGroupMember
        ? await this.getStubClaimSummary(invite.targetGroupMember)
        : null,
    };
  }

  // The stub's recognizable history for the claim page: where it sits, its rating, and
  // its last few matches with partner/opponents resolved from the stub's own side.
  private async getStubClaimSummary(stub: {
    id: string;
    displayName: string | null;
    rating: number;
    currentRank: number | null;
    user: { firstName: string; lastName: string } | null;
  }): Promise<ClaimStubSummary> {
    const [matchesCount, recent] = await Promise.all([
      this.prisma.matchPlayer.count({
        where: { groupMemberId: stub.id, match: { deletedAt: null } },
      }),
      this.prisma.matchPlayer.findMany({
        where: { groupMemberId: stub.id, match: { deletedAt: null } },
        orderBy: [{ playedAt: 'desc' }, { createdAt: 'desc' }],
        take: 3,
        include: {
          match: {
            include: {
              players: {
                orderBy: [{ team: 'asc' }, { position: 'asc' }],
                include: {
                  groupMember: {
                    select: {
                      displayName: true,
                      user: { select: { firstName: true, lastName: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const recentMatches = recent.map((matchPlayer) => {
      const match = matchPlayer.match;
      const isTeamA = matchPlayer.team === MatchTeam.TEAM_A;
      return {
        id: match.id,
        result: (match.winnerTeam === matchPlayer.team ? 'WIN' : 'LOSS') as
          | 'WIN'
          | 'LOSS',
        partners: match.players
          .filter((p) => p.team === matchPlayer.team && p.id !== matchPlayer.id)
          .map((p) => resolveMemberDisplayName(p.groupMember)),
        opponents: match.players
          .filter((p) => p.team !== matchPlayer.team)
          .map((p) => resolveMemberDisplayName(p.groupMember)),
        scoreFor: isTeamA ? match.gamesA : match.gamesB,
        scoreAgainst: isTeamA ? match.gamesB : match.gamesA,
        playedAt: match.playedAt,
      };
    });

    return {
      groupMemberId: stub.id,
      displayName: resolveMemberDisplayName(stub),
      rank: stub.currentRank,
      rating: stub.rating,
      matchesCount,
      recentMatches,
    };
  }

  async accept(groupId: string, token: string, body: { userId: string }) {
    if (!body.userId) {
      throw new BadRequestException('User is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: body.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const invite = await this.prisma.groupInvite.findUnique({
      where: { token },
      include: {
        group: true,
      },
    });

    if (!invite || invite.groupId !== groupId) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.revokedAt) {
      throw new BadRequestException('Invite was revoked');
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new BadRequestException('Invite expired');
    }

    if (invite.maxUses !== null && invite.uses >= invite.maxUses) {
      throw new BadRequestException('Invite has reached the usage limit');
    }

    if (invite.targetGroupMemberId) {
      return this.acceptClaim(groupId, invite, user);
    }

    return this.prisma.$transaction(async (tx) => {
      const existingMembership = await tx.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId: body.userId,
          },
        },
      });

      const membership =
        existingMembership && !existingMembership.leftAt
          ? existingMembership
          : existingMembership
            ? await tx.groupMember.update({
                where: { id: existingMembership.id },
                data: {
                  leftAt: null,
                },
              })
            : await tx.groupMember.create({
                data: {
                  groupId,
                  userId: body.userId,
                },
              });

      const didJoinGroup =
        !existingMembership || existingMembership.leftAt !== null;

      if (didJoinGroup) {
        await tx.groupInvite.update({
          where: { id: invite.id },
          data: {
            uses: { increment: 1 },
          },
        });

        await this.feedOrchestrator.createMemberJoinedItem(
          {
            groupId,
            displayName: resolveMemberDisplayName({ user }),
            actorUserId: user.id,
            actorGroupMemberId: membership.id,
            occurredAt: new Date(),
          },
          tx,
        );
      }

      await this.groupHomeSummary.syncGroupSummary(groupId, tx);

      return this.findMembershipResponse(tx, membership.id);
    });
  }

  private findMembershipResponse(tx: Prisma.TransactionClient, id: string) {
    return tx.groupMember.findUnique({
      where: { id },
      include: {
        group: true,
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  // Claim path: attach the accepter's account to the stub. Case A (accepter not yet
  // a member) is a clean userId set with the history kept on the same groupMemberId.
  // Case B (already a member) merges the stub into that membership — unless the two
  // ever shared a match, which would make the merged history impossible.
  private async acceptClaim(
    groupId: string,
    invite: { id: string; targetGroupMemberId: string | null },
    user: { id: string; firstName: string; lastName: string },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const stub = await tx.groupMember.findUnique({
        where: { id: invite.targetGroupMemberId as string },
      });

      if (!stub || stub.groupId !== groupId || stub.leftAt) {
        throw new NotFoundException('Perfil não encontrado');
      }

      if (stub.userId !== null) {
        throw new BadRequestException('Este perfil já foi assumido.');
      }

      const existingMembership = await tx.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: user.id } },
      });

      if (existingMembership) {
        return this.mergeStubIntoMembership(
          tx,
          groupId,
          invite.id,
          stub,
          existingMembership,
          user.id,
        );
      }

      // Atomic single-use guard: only the first claimer matches userId: null, so
      // two concurrent accepts of the same link can't both take over the stub.
      const claimed = await tx.groupMember.updateMany({
        where: { id: stub.id, userId: null },
        data: { userId: user.id, displayName: null },
      });

      if (claimed.count === 0) {
        throw new BadRequestException('Este perfil já foi assumido.');
      }

      await tx.groupInvite.update({
        where: { id: invite.id },
        data: { uses: { increment: 1 }, claimedByUserId: user.id },
      });

      await this.feedOrchestrator.createMemberJoinedItem(
        {
          groupId,
          displayName: resolveMemberDisplayName({ user }),
          actorUserId: user.id,
          actorGroupMemberId: stub.id,
          occurredAt: new Date(),
        },
        tx,
      );

      await this.groupHomeSummary.syncGroupSummary(groupId, tx);

      return {
        outcome: 'CLAIMED' as const,
        membership: await this.findMembershipResponse(tx, stub.id),
      };
    });
  }

  // Case B merge: fold the stub's history into the membership the accepter already
  // has in this group, then remove the stub. Forbidden when the two ever shared a
  // match — re-pointing the stub's MatchPlayer rows onto the membership would break
  // @@unique([matchId, groupMemberId]) (one person twice in the same match).
  private async mergeStubIntoMembership(
    tx: Prisma.TransactionClient,
    groupId: string,
    inviteId: string,
    stub: {
      id: string;
      displayName: string | null;
      user?: { firstName: string; lastName: string } | null;
    },
    membership: { id: string; leftAt: Date | null },
    userId: string,
  ) {
    const stubId = stub.id;

    // A shared match means the two are provably different people — merging would put
    // one person twice in the same match (breaks @@unique([matchId, groupMemberId])).
    // This isn't an error: the claim page renders it, so return it as a real outcome.
    const sharedMatches = await this.findSharedMatches(
      tx,
      groupId,
      stubId,
      membership.id,
    );

    if (sharedMatches.length > 0) {
      return {
        outcome: 'BLOCKED' as const,
        stubName: resolveMemberDisplayName(stub),
        sharedMatches,
        admins: await this.listGroupAdmins(tx, groupId),
      };
    }

    // Move the stub's match history onto the existing membership. This MUST happen
    // before the stub is deleted — MatchPlayer's FK is onDelete: Restrict, so any
    // row left on the stub would block the delete. The shared-match guard above
    // guarantees no @@unique([matchId, groupMemberId]) collision on the re-point.
    await tx.matchPlayer.updateMany({
      where: { groupMemberId: stubId, groupId },
      data: { groupMemberId: membership.id },
    });

    // Re-point product moments before the stub is deleted (the FK is SetNull, so a
    // delete would otherwise orphan them). The actor was really this person.
    await tx.feedItem.updateMany({
      where: { actorGroupMemberId: stubId },
      data: { actorGroupMemberId: membership.id },
    });

    // Reactivate the membership if the accepter had previously left the group.
    if (membership.leftAt) {
      await tx.groupMember.update({
        where: { id: membership.id },
        data: { leftAt: null },
      });
    }

    // Consume the invite and detach it from the stub so it survives as an audit
    // record (otherwise the stub delete would cascade it away).
    await tx.groupInvite.update({
      where: { id: inviteId },
      data: {
        uses: { increment: 1 },
        claimedByUserId: userId,
        targetGroupMemberId: null,
      },
    });

    // Delete the now-empty stub. Its derived rows cascade; the rebuild recomputes
    // ratings/ranks/stats with the stub's matches now attributed to the membership.
    // Guarded delete (count, not throw) so a concurrent accept of the same single-use
    // link gets a clean message instead of a raw "record not found" on the loser.
    const deleted = await tx.groupMember.deleteMany({
      where: { id: stubId, userId: null },
    });

    if (deleted.count === 0) {
      throw new BadRequestException('Este perfil já foi assumido.');
    }

    await this.processingJobs.enqueueGroupJob(
      { type: 'GROUP_RANKING_REBUILD', groupId },
      tx,
    );

    return {
      outcome: 'CLAIMED' as const,
      membership: await this.findMembershipResponse(tx, membership.id),
    };
  }

  // The non-deleted matches in this group where both members played (as partners or
  // opponents), with each team's players, score and winner — for the conflict screen.
  private async findSharedMatches(
    tx: Prisma.TransactionClient,
    groupId: string,
    stubId: string,
    membershipId: string,
  ): Promise<SharedMatch[]> {
    const matches = await tx.match.findMany({
      where: {
        groupId,
        deletedAt: null,
        players: { some: { groupMemberId: stubId } },
        AND: [{ players: { some: { groupMemberId: membershipId } } }],
      },
      orderBy: [{ playedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        players: {
          orderBy: [{ team: 'asc' }, { position: 'asc' }],
          include: {
            groupMember: {
              select: {
                displayName: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    return matches.map((match) => {
      const buildTeam = (team: MatchTeam): SharedMatchTeam => ({
        team,
        score: team === MatchTeam.TEAM_A ? match.gamesA : match.gamesB,
        won: match.winnerTeam === team,
        players: match.players
          .filter((player) => player.team === team)
          .map((player) => ({
            name: resolveMemberDisplayName(player.groupMember),
            isStub: player.groupMemberId === stubId,
            isYou: player.groupMemberId === membershipId,
          })),
      });

      return {
        id: match.id,
        playedAt: match.playedAt,
        teams: [buildTeam(MatchTeam.TEAM_A), buildTeam(MatchTeam.TEAM_B)],
      };
    });
  }

  // The group's admins, for the "fale com um admin" contact chips on the conflict screen.
  private async listGroupAdmins(
    tx: Prisma.TransactionClient,
    groupId: string,
  ): Promise<ClaimAdmin[]> {
    const admins = await tx.groupMember.findMany({
      where: { groupId, role: GroupMemberRole.ADMIN, leftAt: null },
      select: {
        id: true,
        displayName: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });

    return admins.map((admin) => ({
      groupMemberId: admin.id,
      name: resolveMemberDisplayName(admin),
    }));
  }

  async acceptByToken(token: string, body: { userId: string }) {
    const invite = await this.prisma.groupInvite.findUnique({
      where: { token },
      select: {
        groupId: true,
      },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    return this.accept(invite.groupId, token, body);
  }
}
