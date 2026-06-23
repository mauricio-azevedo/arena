import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GroupMemberRole } from '../generated/prisma/enums';
import { resolveMemberDisplayName } from '../common/member-display-name';
import { requireGroupAdmin } from '../common/require-group-admin';
import { PrismaService } from '../prisma/prisma.service';
import { ClaimService } from '../claims/claim.service';
import { NotificationWriterService } from '../notifications/notification-writer.service';
import type {
  ClaimRequestDetail,
  CreateClaimRequestResult,
} from './types/claim-request.types';

// The request/approval path for claiming a stub when there's no link: a person asks,
// any group admin approves (running the same claim/merge) or declines. Notifications
// carry it between them.
@Injectable()
export class ClaimRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly claims: ClaimService,
    private readonly notifications: NotificationWriterService,
  ) {}

  async createRequest(
    groupId: string,
    stubId: string,
    requesterUserId: string,
  ): Promise<CreateClaimRequestResult> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const requester = await this.prisma.user.findUnique({
      where: { id: requesterUserId },
    });
    if (!requester) {
      throw new NotFoundException('User not found');
    }

    const stub = await this.prisma.groupMember.findFirst({
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

    // If the requester already plays here, a shared match makes the claim impossible —
    // refuse now with the rich payload instead of creating a doomed request.
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: requesterUserId } },
    });
    if (membership && !membership.leftAt) {
      const sharedMatches = await this.claims.findSharedMatches(
        this.prisma,
        groupId,
        stub.id,
        membership.id,
      );
      if (sharedMatches.length > 0) {
        return {
          outcome: 'BLOCKED',
          stubName: resolveMemberDisplayName(stub),
          sharedMatches,
          admins: await this.claims.listGroupAdmins(this.prisma, groupId),
        };
      }
    }

    const existingPending = await this.prisma.claimRequest.findFirst({
      where: { stubGroupMemberId: stub.id, status: 'PENDING' },
      select: { id: true },
    });
    if (existingPending) {
      throw new BadRequestException(
        'Já existe uma solicitação pendente para este perfil.',
      );
    }

    const stubName = resolveMemberDisplayName(stub);
    const requesterName = `${requester.firstName} ${requester.lastName}`.trim();

    try {
      return await this.prisma.$transaction(async (tx) => {
        const request = await tx.claimRequest.create({
          data: { groupId, stubGroupMemberId: stub.id, requesterUserId },
        });

        const admins = await tx.groupMember.findMany({
          where: {
            groupId,
            role: GroupMemberRole.ADMIN,
            leftAt: null,
            userId: { not: null },
          },
          select: { userId: true },
        });

        for (const admin of admins) {
          await this.notifications.create(
            {
              type: 'CLAIM_REQUEST',
              recipientUserId: admin.userId as string,
              groupId,
              actorUserId: requesterUserId,
              data: {
                title: `${requesterName} quer assumir o perfil ${stubName}`,
                body: `Pediu para assumir este perfil em ${group.name}. Sem partidas em comum — pode aprovar.`,
                meta: 'pede sua aprovação',
                actions: [
                  { label: 'Revisar', href: `/claim-requests/${request.id}` },
                ],
              },
            },
            tx,
          );
        }

        return {
          outcome: 'REQUESTED' as const,
          requestId: request.id,
          status: request.status,
        };
      });
    } catch (error) {
      // A concurrent request for the same stub trips the partial-unique pending index
      // — surface it as the same clean message as the pre-check above.
      if (
        error instanceof Object &&
        (error as { code?: string }).code === 'P2002'
      ) {
        throw new BadRequestException(
          'Já existe uma solicitação pendente para este perfil.',
        );
      }
      throw error;
    }
  }

  async approve(requestId: string, adminUserId: string) {
    const request = await this.prisma.claimRequest.findUnique({
      where: { id: requestId },
      include: {
        group: { select: { name: true } },
        requester: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!request) {
      throw new NotFoundException('Solicitação não encontrada');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Esta solicitação já foi resolvida.');
    }
    // The stub FK is SetNull, so a pending request can lose its stub if it was claimed
    // another way meanwhile. Narrow to a non-null id for the lookup below.
    const stubGroupMemberId = request.stubGroupMemberId;
    if (!stubGroupMemberId) {
      throw new BadRequestException('Este perfil não está mais disponível.');
    }

    const admin = await requireGroupAdmin(
      this.prisma,
      request.groupId,
      adminUserId,
    );
    const adminName = resolveMemberDisplayName(admin);

    return this.prisma.$transaction(async (tx) => {
      const stub = await tx.groupMember.findFirst({
        where: {
          id: stubGroupMemberId,
          groupId: request.groupId,
        },
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

      const stubName = resolveMemberDisplayName(stub);
      const result = await this.claims.performClaim(
        tx,
        request.groupId,
        stub,
        request.requester,
      );

      if (result.outcome === 'BLOCKED') {
        // A match was logged between the request and the approval. Don't resolve it —
        // the admin can decline, or the mis-logged match can be fixed.
        throw new ConflictException(
          'Não dá para aprovar: o solicitante e este perfil já jogaram a mesma partida.',
        );
      }

      await tx.claimRequest.update({
        where: { id: request.id },
        data: {
          status: 'APPROVED',
          resolvedByUserId: adminUserId,
          resolvedAt: new Date(),
        },
      });

      await this.notifications.create(
        {
          type: 'CLAIM_APPROVED',
          recipientUserId: request.requesterUserId,
          groupId: request.groupId,
          actorUserId: adminUserId,
          data: {
            title: 'Sua solicitação foi aprovada',
            body: `O perfil ${stubName} agora é seu em ${request.group.name} — todo o histórico passou para a sua conta.`,
            meta: `aprovado por ${adminName}`,
            actions: [{ label: 'Ver meu perfil', href: '/profile' }],
          },
        },
        tx,
      );

      return { outcome: 'APPROVED' as const, requestId: request.id };
    });
  }

  async decline(requestId: string, adminUserId: string) {
    const request = await this.prisma.claimRequest.findUnique({
      where: { id: requestId },
      include: {
        group: { select: { name: true } },
        stub: {
          select: {
            displayName: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!request) {
      throw new NotFoundException('Solicitação não encontrada');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Esta solicitação já foi resolvida.');
    }

    const admin = await requireGroupAdmin(
      this.prisma,
      request.groupId,
      adminUserId,
    );
    const stubName = request.stub
      ? resolveMemberDisplayName(request.stub)
      : 'o perfil';

    return this.prisma.$transaction(async (tx) => {
      await tx.claimRequest.update({
        where: { id: request.id },
        data: {
          status: 'DECLINED',
          resolvedByUserId: adminUserId,
          resolvedAt: new Date(),
        },
      });

      await this.notifications.create(
        {
          type: 'CLAIM_DECLINED',
          recipientUserId: request.requesterUserId,
          groupId: request.groupId,
          actorUserId: adminUserId,
          data: {
            title: 'Solicitação não aprovada',
            body: `Sua solicitação para assumir ${stubName} em ${request.group.name} não foi aprovada.`,
            meta: `por ${resolveMemberDisplayName(admin)}`,
          },
        },
        tx,
      );

      return { outcome: 'DECLINED' as const, requestId: request.id };
    });
  }

  async getRequest(
    requestId: string,
    viewerUserId: string,
  ): Promise<ClaimRequestDetail> {
    const request = await this.prisma.claimRequest.findUnique({
      where: { id: requestId },
      include: {
        group: { select: { id: true, name: true } },
        requester: { select: { id: true, firstName: true, lastName: true } },
        stub: {
          select: {
            displayName: true,
            rating: true,
            currentRank: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!request) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    // Visible to group admins (to act) and to the requester (to track status).
    if (request.requesterUserId !== viewerUserId) {
      await requireGroupAdmin(this.prisma, request.groupId, viewerUserId);
    }

    let hasConflict = false;
    let matchesCount = 0;
    if (request.stubGroupMemberId) {
      matchesCount = await this.prisma.matchPlayer.count({
        where: {
          groupMemberId: request.stubGroupMemberId,
          match: { deletedAt: null },
        },
      });

      const membership = await this.prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: request.groupId,
            userId: request.requesterUserId,
          },
        },
        select: { id: true, leftAt: true },
      });
      if (membership && !membership.leftAt) {
        const shared = await this.claims.findSharedMatches(
          this.prisma,
          request.groupId,
          request.stubGroupMemberId,
          membership.id,
        );
        hasConflict = shared.length > 0;
      }
    }

    return {
      id: request.id,
      status: request.status,
      groupId: request.group.id,
      groupName: request.group.name,
      stub: {
        groupMemberId: request.stubGroupMemberId,
        name: request.stub ? resolveMemberDisplayName(request.stub) : 'Perfil',
        rank: request.stub?.currentRank ?? null,
        rating: request.stub?.rating ?? null,
        matchesCount,
      },
      requester: {
        userId: request.requester.id,
        name: `${request.requester.firstName} ${request.requester.lastName}`.trim(),
      },
      hasConflict,
      createdAt: request.createdAt,
      resolvedAt: request.resolvedAt,
    };
  }
}
