import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GroupMemberRole } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    groupId: string,
    requesterUserId: string,
    body: { userId: string; displayName?: string },
  ) {
    if (!body.userId) {
      throw new BadRequestException('User is required');
    }

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const requesterMembership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: requesterUserId,
        },
      },
    });

    if (!requesterMembership || requesterMembership.leftAt) {
      throw new ForbiddenException('Only active group members can add players');
    }

    if (requesterMembership.role !== GroupMemberRole.ADMIN) {
      throw new ForbiddenException('Only group admins can add players');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: body.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingMembership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: body.userId,
        },
      },
    });

    if (existingMembership && !existingMembership.leftAt) {
      return existingMembership;
    }

    const displayName =
      body.displayName?.trim() || `${user.firstName} ${user.lastName}`.trim();

    if (existingMembership) {
      return this.prisma.groupMember.update({
        where: { id: existingMembership.id },
        data: {
          displayName,
          leftAt: null,
        },
      });
    }

    return this.prisma.groupMember.create({
      data: {
        groupId,
        userId: body.userId,
        displayName,
      },
    });
  }

  async findAll(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return this.prisma.groupMember.findMany({
      where: {
        groupId,
        leftAt: null,
      },
      orderBy: [{ rating: 'desc' }, { displayName: 'asc' }],
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
    });
  }
}
