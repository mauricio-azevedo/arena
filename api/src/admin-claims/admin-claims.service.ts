import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GroupMemberRole } from '../generated/prisma/enums';
import { resolveMemberDisplayName } from '../common/member-display-name';
import { PrismaService } from '../prisma/prisma.service';
import { ClaimService } from '../claims/claim.service';
import { NotificationWriterService } from '../notifications/notification-writer.service';
import { GroupInvitesService } from '../group-invites/group-invites.service';

// Admin shortcuts on a stub: claim it for yourself immediately (no approval, because
// you're an admin), or invite any platform user — by in-app notification — to claim it.
@Injectable()
export class AdminClaimsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly claims: ClaimService,
    private readonly notifications: NotificationWriterService,
    private readonly invites: GroupInvitesService,
  ) {}

  // "Reivindicar direto": the admin takes over the stub onto their own account now.
  async claimForSelf(groupId: string, stubId: string, adminUserId: string) {
    const admin = await this.requireGroupAdmin(groupId, adminUserId);

    return this.prisma.$transaction(async (tx) => {
      const stub = await tx.groupMember.findFirst({
        where: { id: stubId, groupId },
        select: {
          id: true,
          userId: true,
          leftAt: true,
          displayName: true,
          user: { select: { firstName: true, lastName: true } },
        },
      });
      if (!stub || stub.leftAt) {
        throw new NotFoundException('Perfil não encontrado');
      }
      if (stub.userId !== null) {
        throw new BadRequestException('Este perfil já foi assumido.');
      }

      return this.claims.performClaim(tx, groupId, stub, {
        id: adminUserId,
        firstName: admin.user?.firstName ?? '',
        lastName: admin.user?.lastName ?? '',
      });
    });
  }

  // "Enviar pelo app": mint a claim link for the stub and notify the chosen user, so
  // they can take it over from their inbox. The link is the authorization they carry.
  async inviteToClaim(
    groupId: string,
    stubId: string,
    adminUserId: string,
    targetUserId: string,
  ) {
    const admin = await this.requireGroupAdmin(groupId, adminUserId);

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });
    if (!target) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // createClaimLink validates the stub (in this group, unclaimed) and mints the link.
    const invite = await this.invites.createClaimLink(
      groupId,
      stubId,
      adminUserId,
    );

    const [group, stub, matchesCount] = await Promise.all([
      this.prisma.group.findUnique({
        where: { id: groupId },
        select: { name: true },
      }),
      this.prisma.groupMember.findUnique({
        where: { id: stubId },
        select: {
          displayName: true,
          user: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.matchPlayer.count({
        where: { groupMemberId: stubId, match: { deletedAt: null } },
      }),
    ]);

    const adminName = resolveMemberDisplayName(admin);
    const stubName = stub ? resolveMemberDisplayName(stub) : 'um perfil';
    const groupName = group?.name ?? 'um grupo';
    const matchesLine =
      matchesCount > 0
        ? ` — com todo o histórico de ${matchesCount} ${matchesCount === 1 ? 'partida' : 'partidas'}`
        : '';

    await this.notifications.create({
      type: 'CLAIM_INVITE',
      recipientUserId: targetUserId,
      groupId,
      actorUserId: adminUserId,
      data: {
        title: `${adminName} convidou você a assumir um perfil`,
        body: `O perfil ${stubName}, em ${groupName}, pode ser seu${matchesLine}.`,
        meta: `convite de ${adminName}`,
        actions: [{ label: 'Assumir perfil', href: invite.path }],
      },
    });

    return { ok: true as const };
  }

  private async requireGroupAdmin(groupId: string, userId: string) {
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
      select: {
        role: true,
        leftAt: true,
        displayName: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });

    if (!membership || membership.leftAt) {
      throw new ForbiddenException('Apenas membros do grupo podem fazer isso');
    }
    if (membership.role !== GroupMemberRole.ADMIN) {
      throw new ForbiddenException('Apenas admins do grupo podem fazer isso');
    }

    return membership;
  }
}
