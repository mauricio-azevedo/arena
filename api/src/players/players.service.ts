import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

  create(name: string) {
    return this.prisma.player.create({
      data: { name },
    });
  }

  findAll() {
    return this.prisma.player.findMany({
      orderBy: { rating: 'desc' },
    });
  }
}
