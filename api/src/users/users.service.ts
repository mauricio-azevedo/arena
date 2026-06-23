import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findGroups(userId: string) {
    await this.ensureUserExists(userId);

    return this.prisma.groupMember.findMany({
      where: {
        userId,
        leftAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        role: true,
        rating: true,
        groupId: true,
        createdAt: true,
        updatedAt: true,
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
      },
    });
  }

  // Find platform users by name or email — for an admin inviting someone to claim a
  // stub. Needs a real query (>= 2 chars), caps at 10, and never returns the searcher.
  async search(query: string, excludeUserId?: string) {
    const term = query.trim();

    if (term.length < 2) {
      return [];
    }

    return this.prisma.user.findMany({
      where: {
        id: excludeUserId ? { not: excludeUserId } : undefined,
        OR: [
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
        ],
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      take: 10,
      select: { id: true, firstName: true, lastName: true, email: true },
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
