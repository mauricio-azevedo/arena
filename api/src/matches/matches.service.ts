import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateBeachRating } from '../rating/calculate-beach-rating';

type CreateMatchBody = {
  teamAPlayer1Id: string;
  teamAPlayer2Id: string;
  teamBPlayer1Id: string;
  teamBPlayer2Id: string;
  gamesA: number;
  gamesB: number;
};

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: CreateMatchBody) {
    const playerIds = [
      body.teamAPlayer1Id,
      body.teamAPlayer2Id,
      body.teamBPlayer1Id,
      body.teamBPlayer2Id,
    ];

    if (new Set(playerIds).size !== 4) {
      throw new BadRequestException('A player cannot appear twice in a match');
    }

    if (body.gamesA < 0 || body.gamesB < 0 || body.gamesA + body.gamesB === 0) {
      throw new BadRequestException('Invalid score');
    }

    const players = await this.prisma.player.findMany({
      where: { id: { in: playerIds } },
    });

    if (players.length !== 4) {
      throw new NotFoundException('One or more players were not found');
    }

    const byId = Object.fromEntries(
      players.map((player) => [player.id, player]),
    );

    const result = calculateBeachRating({
      teamA: [byId[body.teamAPlayer1Id], byId[body.teamAPlayer2Id]],
      teamB: [byId[body.teamBPlayer1Id], byId[body.teamBPlayer2Id]],
      gamesA: body.gamesA,
      gamesB: body.gamesB,
    });

    return this.prisma.$transaction(async (tx) => {
      for (const player of result.teamA.players) {
        await tx.player.update({
          where: { id: player.id },
          data: { rating: player.newRating },
        });
      }

      for (const player of result.teamB.players) {
        await tx.player.update({
          where: { id: player.id },
          data: { rating: player.newRating },
        });
      }

      return tx.match.create({
        data: {
          teamAPlayer1Id: body.teamAPlayer1Id,
          teamAPlayer2Id: body.teamAPlayer2Id,
          teamBPlayer1Id: body.teamBPlayer1Id,
          teamBPlayer2Id: body.teamBPlayer2Id,
          gamesA: body.gamesA,
          gamesB: body.gamesB,
          ratingDeltaA: result.teamA.delta,
          ratingDeltaB: result.teamB.delta,
        },
        include: {
          teamAPlayer1: true,
          teamAPlayer2: true,
          teamBPlayer1: true,
          teamBPlayer2: true,
        },
      });
    });
  }

  findAll() {
    return this.prisma.match.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        teamAPlayer1: true,
        teamAPlayer2: true,
        teamBPlayer1: true,
        teamBPlayer2: true,
      },
    });
  }
}
