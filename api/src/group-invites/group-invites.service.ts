import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { GroupMemberRole } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { FeedOrchestratorService } from '../feed/feed-orchestrator.service';
import { GroupHomeSummaryService } from '../groups/group-home-summary.service';

@Injectable()
export class GroupInvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feedOrchestrator: FeedOrchestratorService,
    private readonly groupHomeSummary: GroupHomeSummaryService,
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

    return invite;
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
            displayName: this.getUserDisplayName(user),
            actorUserId: user.id,
            actorGroupMemberId: membership.id,
            occurredAt: new Date(),
          },
          tx,
        );
      }

      await this.groupHomeSummary.syncGroupSummary(groupId, tx);

      return tx.groupMember.findUnique({
        where: { id: membership.id },
        include: {
          group: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    });
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

  private getUserDisplayName(user: { firstName: string; lastName: string }) {
    return `${user.firstName} ${user.lastName}`.trim();
  }
}
