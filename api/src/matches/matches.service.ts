import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateBeachRating } from '../rating/calculate-beach-rating';
import type { Prisma } from '../generated/prisma/client';

type MatchBody = {
  teamAPlayer1Id: string;
  teamAPlayer2Id: string;
  teamBPlayer1Id: string;
  teamBPlayer2Id: string;
  gamesA: number;
  gamesB: number;
};

const INITIAL_RATING = 1000;

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: MatchBody) {
    this.validateMatchBody(body);

    return this.prisma.$transaction(async (tx) => {
      await this.ensurePlayersExist(tx, body);

      const match = await tx.match.create({
        data: {
          ...body,
          ratingDeltaA: 0,
          ratingDeltaB: 0,
        },
      });

      await this.recalculateRatings(tx);

      return tx.match.findUnique({
        where: { id: match.id },
        include: this.matchInclude(),
      });
    });
  }

  async update(id: string, body: MatchBody) {
    this.validateMatchBody(body);

    return this.prisma.$transaction(async (tx) => {
      const existingMatch = await tx.match.findUnique({
        where: { id },
      });

      if (!existingMatch) {
        throw new NotFoundException('Match not found');
      }

      await this.ensurePlayersExist(tx, body);

      await tx.match.update({
        where: { id },
        data: {
          ...body,
          ratingDeltaA: 0,
          ratingDeltaB: 0,
        },
      });

      await this.recalculateRatings(tx);

      return tx.match.findUnique({
        where: { id },
        include: this.matchInclude(),
      });
    });
  }

  findAll() {
    return this.prisma.match.findMany({
      orderBy: { createdAt: 'desc' },
      include: this.matchInclude(),
    });
  }

  private validateMatchBody(body: MatchBody) {
    const playerIds = [
      body.teamAPlayer1Id,
      body.teamAPlayer2Id,
      body.teamBPlayer1Id,
      body.teamBPlayer2Id,
    ];

    if (playerIds.some((id) => !id)) {
      throw new BadRequestException('All players are required');
    }

    if (new Set(playerIds).size !== 4) {
      throw new BadRequestException('A player cannot appear twice in a match');
    }

    if (body.gamesA < 0 || body.gamesB < 0 || body.gamesA + body.gamesB === 0) {
      throw new BadRequestException('Invalid score');
    }
  }

  private async ensurePlayersExist(
    tx: Prisma.TransactionClient,
    body: MatchBody,
  ) {
    const playerIds = [
      body.teamAPlayer1Id,
      body.teamAPlayer2Id,
      body.teamBPlayer1Id,
      body.teamBPlayer2Id,
    ];

    const players = await tx.player.findMany({
      where: { id: { in: playerIds } },
    });

    if (players.length !== 4) {
      throw new NotFoundException('One or more players were not found');
    }
  }

  private async recalculateRatings(tx: Prisma.TransactionClient) {
    type RatingState = {
      id: string;
      name: string;
      rating: number;
    };

    const players = (await tx.player.findMany({
      select: {
        id: true,
        name: true,
        rating: true,
      },
    })) as RatingState[];

    const playersById = new Map<string, RatingState>(
      players.map((player) => [
        player.id,
        {
          id: player.id,
          name: player.name,
          rating: INITIAL_RATING,
        },
      ]),
    );

    const matches = await tx.match.findMany({
      orderBy: { createdAt: 'asc' },
    });

    for (const match of matches) {
      const teamAPlayer1 = playersById.get(match.teamAPlayer1Id);
      const teamAPlayer2 = playersById.get(match.teamAPlayer2Id);
      const teamBPlayer1 = playersById.get(match.teamBPlayer1Id);
      const teamBPlayer2 = playersById.get(match.teamBPlayer2Id);

      if (!teamAPlayer1 || !teamAPlayer2 || !teamBPlayer1 || !teamBPlayer2) {
        throw new Error('Invalid match players');
      }

      const result = calculateBeachRating({
        teamA: [teamAPlayer1, teamAPlayer2],
        teamB: [teamBPlayer1, teamBPlayer2],
        gamesA: match.gamesA,
        gamesB: match.gamesB,
      });

      for (const player of result.teamA.players) {
        playersById.set(player.id, {
          id: player.id,
          name: player.name,
          rating: player.newRating,
        });
      }

      for (const player of result.teamB.players) {
        playersById.set(player.id, {
          id: player.id,
          name: player.name,
          rating: player.newRating,
        });
      }

      await tx.match.update({
        where: { id: match.id },
        data: {
          ratingDeltaA: result.teamA.delta,
          ratingDeltaB: result.teamB.delta,
        },
      });
    }

    for (const player of playersById.values()) {
      await tx.player.update({
        where: { id: player.id },
        data: {
          rating: player.rating,
        },
      });
    }
  }

  private matchInclude() {
    return {
      teamAPlayer1: true,
      teamAPlayer2: true,
      teamBPlayer1: true,
      teamBPlayer2: true,
    };
  }
}
