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
    body: { userId: string },
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
      throw new ForbiddenException('Only active group members can add members');
    }

    if (requesterMembership.role !== GroupMemberRole.ADMIN) {
      throw new ForbiddenException('Only group admins can add members');
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
      return this.findOne(existingMembership.id);
    }

    const membership = existingMembership
      ? await this.prisma.groupMember.update({
          where: { id: existingMembership.id },
          data: {
            leftAt: null,
          },
        })
      : await this.prisma.groupMember.create({
          data: {
            groupId,
            userId: body.userId,
          },
        });

    return this.findOne(membership.id);
  }

  // Creates a stub player (jogador sem conta): just a name, no User account. Any
  // active member can do it — it's low-risk and high-frequency, the arena path.
  async createGuest(
    groupId: string,
    requesterUserId: string,
    body: { name: string },
  ) {
    const name = body.name?.trim();

    if (!name) {
      throw new BadRequestException('Name is required');
    }

    if (name.length > 60) {
      throw new BadRequestException('Name is too long');
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

    const membership = await this.prisma.groupMember.create({
      data: {
        groupId,
        userId: null,
        displayName: name,
      },
    });

    return this.findOne(membership.id);
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
      orderBy: [
        { rating: 'desc' },
        { user: { firstName: 'asc' } },
        { user: { lastName: 'asc' } },
      ],
      include: this.memberInclude(),
    });
  }

  private findOne(id: string) {
    return this.prisma.groupMember.findUnique({
      where: { id },
      include: this.memberInclude(),
    });
  }

  private memberInclude() {
    return {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    };
  }
}
