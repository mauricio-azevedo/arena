import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RankingService {
  constructor(private readonly prisma: PrismaService) {}

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
      select: {
        id: true,
        displayName: true,
        rating: true,
        ratingDeviation: true,
        ratingVolatility: true,
        ratingMu: true,
        ratingSigma: true,
        ratingAlgorithm: true,
        role: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
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
