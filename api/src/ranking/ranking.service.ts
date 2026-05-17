import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RankingService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.player.findMany({
      orderBy: {
        rating: 'desc',
      },
      select: {
        id: true,
        name: true,
        rating: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
