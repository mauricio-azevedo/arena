import { Injectable, NotFoundException } from '@nestjs/common';
import type { GroupBody, GroupResponse } from '@arena/contracts/groups';
import { pickDefaultAvatarColor } from '../common/avatar-color';
import { GroupMemberRole } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { FeedOrchestratorService } from '../feed/feed-orchestrator.service';
import { GroupHomeSummaryService } from './group-home-summary.service';

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feedOrchestrator: FeedOrchestratorService,
    private readonly groupHomeSummary: GroupHomeSummaryService,
  ) {}

  async create(
    body: GroupBody & { createdById: string },
  ): Promise<GroupResponse> {
    const creator = await this.prisma.user.findUnique({
      where: { id: body.createdById },
    });

    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          name: body.name,
          description: body.description || null,
          // An omitted colour falls back to a deterministic varied default
          // (seeded by the name) so groups aren't all blue.
          avatarColor: body.avatarColor ?? pickDefaultAvatarColor(body.name),
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

      await this.groupHomeSummary.syncGroupSummary(group.id, tx);

      return group;
    });
  }

  // Every `Group` column is promised by `groupSchema`, so the row is the
  // response; a column added to the model fails the e2e parse until it is
  // promised there or selected away here.
  findAll(): Promise<GroupResponse[]> {
    return this.prisma.group.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(groupId: string): Promise<GroupResponse> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return group;
  }
}
