import { BadRequestException, Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import { GroupMemberRole, MatchTeam } from '../generated/prisma/enums';
import { resolveMemberDisplayName } from '../common/member-display-name';
import { PrismaService } from '../prisma/prisma.service';
import { FeedOrchestratorService } from '../feed/feed-orchestrator.service';
import { GroupHomeSummaryService } from '../groups/group-home-summary.service';
import { ProcessingJobWriterService } from '../processing/processing-job-writer.service';
import type {
  ClaimAdmin,
  SharedMatch,
  SharedMatchTeam,
} from './types/claim-result.type';

type PrismaClientLike = Prisma.TransactionClient | PrismaService;

type ClaimUser = { id: string; firstName: string; lastName: string };

type ClaimStub = {
  id: string;
  displayName: string | null;
  user?: { firstName: string; lastName: string } | null;
};

type PerformClaimOptions = {
  // When the claim is authorized by a single-use link, the invite to consume.
  // Absent for admin-approved requests, which carry their own authorization.
  inviteId?: string;
};

// The core of "attach this account to this stub", shared by the claim-link flow
// (group-invites) and the request/approval flow (claim-requests). Case A (the person
// isn't a member yet) is a clean userId set; case B (already a member) merges the stub
// into that membership — unless the two ever shared a match, which makes it impossible.
@Injectable()
export class ClaimService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feedOrchestrator: FeedOrchestratorService,
    private readonly groupHomeSummary: GroupHomeSummaryService,
    private readonly processingJobs: ProcessingJobWriterService,
  ) {}

  async performClaim(
    tx: Prisma.TransactionClient,
    groupId: string,
    stub: ClaimStub,
    user: ClaimUser,
    options: PerformClaimOptions = {},
  ) {
    const existingMembership = await tx.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: user.id } },
    });

    if (existingMembership) {
      return this.mergeStubIntoMembership(
        tx,
        groupId,
        stub,
        existingMembership,
        user,
        options,
      );
    }

    // Atomic single-use guard: only the first claimer matches userId: null, so two
    // concurrent claims of the same stub can't both take it over.
    const claimed = await tx.groupMember.updateMany({
      where: { id: stub.id, userId: null },
      data: { userId: user.id, displayName: null },
    });

    if (claimed.count === 0) {
      throw new BadRequestException('Este perfil já foi assumido.');
    }

    if (options.inviteId) {
      await tx.groupInvite.update({
        where: { id: options.inviteId },
        data: { uses: { increment: 1 }, claimedByUserId: user.id },
      });
    }

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
  }

  // Case B merge: fold the stub's history into the membership the person already has in
  // this group, then remove the stub. Forbidden when the two ever shared a match —
  // re-pointing the stub's MatchPlayer rows onto the membership would break
  // @@unique([matchId, groupMemberId]) (one person twice in the same match).
  private async mergeStubIntoMembership(
    tx: Prisma.TransactionClient,
    groupId: string,
    stub: ClaimStub,
    membership: { id: string; leftAt: Date | null },
    user: ClaimUser,
    options: PerformClaimOptions,
  ) {
    const sharedMatches = await this.findSharedMatches(
      tx,
      groupId,
      stub.id,
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
    // before the stub is deleted — MatchPlayer's FK is onDelete: Restrict, so any row
    // left on the stub would block the delete. The shared-match guard above guarantees
    // no @@unique([matchId, groupMemberId]) collision on the re-point.
    await tx.matchPlayer.updateMany({
      where: { groupMemberId: stub.id, groupId },
      data: { groupMemberId: membership.id },
    });

    // Re-point product moments before the stub is deleted (the FK is SetNull, so a
    // delete would otherwise orphan them). The actor was really this person.
    await tx.feedItem.updateMany({
      where: { actorGroupMemberId: stub.id },
      data: { actorGroupMemberId: membership.id },
    });

    // Reactivate the membership if the person had previously left the group.
    if (membership.leftAt) {
      await tx.groupMember.update({
        where: { id: membership.id },
        data: { leftAt: null },
      });
    }

    // Consume the invite (link flow only) and detach it from the stub so it survives as
    // an audit record (otherwise the stub delete would cascade it away).
    if (options.inviteId) {
      await tx.groupInvite.update({
        where: { id: options.inviteId },
        data: {
          uses: { increment: 1 },
          claimedByUserId: user.id,
          targetGroupMemberId: null,
        },
      });
    }

    // Delete the now-empty stub. Its derived rows cascade; the rebuild recomputes
    // ratings/ranks/stats with the stub's matches now attributed to the membership.
    // Guarded delete (count, not throw) so a concurrent claim gets a clean message.
    const deleted = await tx.groupMember.deleteMany({
      where: { id: stub.id, userId: null },
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

  findMembershipResponse(tx: Prisma.TransactionClient, id: string) {
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

  // The non-deleted matches in this group where both members played (as partners or
  // opponents), with each team's players, score and winner — for the conflict screen.
  async findSharedMatches(
    tx: PrismaClientLike,
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
  async listGroupAdmins(
    tx: PrismaClientLike,
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
}
