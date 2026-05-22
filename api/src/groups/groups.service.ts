import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GroupMemberRole } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { FeedOrchestratorService } from '../feed/feed-orchestrator.service';

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feedOrchestrator: FeedOrchestratorService,
  ) {}

  async create(body: {
    name: string;
    description?: string;
    createdById: string;
  }) {
    const name = body.name?.trim();

    if (!name) {
      throw new BadRequestException('Group name is required');
    }

    if (!body.createdById) {
      throw new BadRequestException('Group creator is required');
    }

    const creator = await this.prisma.user.findUnique({
      where: { id: body.createdById },
    });

    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          name,
          description: body.description?.trim() || null,
          createdById: body.createdById,
        },
      });

      const membership = await tx.groupMember.create({
        data: {
          groupId: group.id,
          userId: body.createdById,
          role: GroupMemberRole.ADMIN,
        },
      });

      await this.feedOrchestrator.createGroupCreatedItem(
        {
          groupId: group.id,
          groupName: group.name,
          actorUserId: creator.id,
          actorGroupMemberId: membership.id,
          occurredAt: group.createdAt,
        },
        tx,
      );

      return tx.group.findUnique({
        where: { id: group.id },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              members: true,
              matches: true,
            },
          },
        },
      });
    });
  }

  findAll() {
    return this.prisma.group.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            members: true,
            matches: true,
          },
        },
      },
    });
  }

  async findOne(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
            matches: true,
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return group;
  }
}
