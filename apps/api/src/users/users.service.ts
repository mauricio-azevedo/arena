import { Injectable, NotFoundException } from '@nestjs/common';
import type { GroupMembershipResponse } from '@arena/contracts/groups';
import { GROUP_MEMBERSHIP_SELECT } from '../groups/group-membership-select';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findGroups(userId: string): Promise<GroupMembershipResponse[]> {
    await this.ensureUserExists(userId);

    return this.prisma.groupMember.findMany({
      where: {
        userId,
        leftAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: GROUP_MEMBERSHIP_SELECT,
    });
  }

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }
}
