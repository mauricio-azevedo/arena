import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type RankingMember = {
  id: string;
  groupId: string;
  rating: number;
  ratingDeviation: number | null;
  ratingVolatility: number | null;
  ratingMu: number | null;
  ratingSigma: number | null;
  ratingAlgorithm: string;
  role: 'ADMIN' | 'MEMBER';
  userId: string;
  leftAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  };
};

type RankingSortableMember = RankingMember & {
  rankingRating: number;
};

type RankingMovement = {
  direction: 'UP';
  positions: number;
  previousPosition: number;
  currentPosition: number;
  sourceMatchId: string;
  occurredAt: Date;
};

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

    const members = await this.prisma.groupMember.findMany({
      where: {
        groupId,
        leftAt: null,
      },
      select: {
        id: true,
        groupId: true,
        rating: true,
        ratingDeviation: true,
        ratingVolatility: true,
        ratingMu: true,
        ratingSigma: true,
        ratingAlgorithm: true,
        role: true,
        userId: true,
        leftAt: true,
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

    return this.withRecentRankingMovement(groupId, members);
  }

  private async withRecentRankingMovement(
    groupId: string,
    members: RankingMember[],
  ) {
    const currentRanking = this.sortRankingMembers(
      members.map((member) => ({ ...member, rankingRating: member.rating })),
    );

    const latestMatch = await this.prisma.match.findFirst({
      where: { groupId },
      orderBy: [{ playedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        playedAt: true,
        players: {
          select: {
            groupMemberId: true,
            ratingBefore: true,
          },
        },
      },
    });

    if (!latestMatch) {
      return currentRanking.map(({ rankingRating, ...member }) => ({
        ...member,
        rankingMovement: null,
      }));
    }

    const latestMatchPlayerByMemberId = new Map(
      latestMatch.players.map((player) => [player.groupMemberId, player]),
    );
    const previousRanking = this.sortRankingMembers(
      currentRanking.map((member) => ({
        ...member,
        rankingRating:
          latestMatchPlayerByMemberId.get(member.id)?.ratingBefore ?? member.rating,
      })),
    );
    const previousPositionByMemberId = new Map(
      previousRanking.map((member, index) => [member.id, index + 1]),
    );

    return currentRanking.map(({ rankingRating, ...member }, index) => {
      const currentPosition = index + 1;
      const previousPosition = previousPositionByMemberId.get(member.id);
      const rankingMovement = this.getRankingMovement({
        currentPosition,
        previousPosition,
        sourceMatchId: latestMatch.id,
        occurredAt: latestMatch.playedAt,
      });

      return {
        ...member,
        rankingMovement,
      };
    });
  }

  private getRankingMovement({
    currentPosition,
    previousPosition,
    sourceMatchId,
    occurredAt,
  }: {
    currentPosition: number;
    previousPosition: number | undefined;
    sourceMatchId: string;
    occurredAt: Date;
  }): RankingMovement | null {
    if (!previousPosition || previousPosition <= currentPosition) {
      return null;
    }

    return {
      direction: 'UP',
      positions: previousPosition - currentPosition,
      previousPosition,
      currentPosition,
      sourceMatchId,
      occurredAt,
    };
  }

  private sortRankingMembers<T extends RankingSortableMember>(members: T[]) {
    return [...members].sort((a, b) => {
      const ratingComparison = b.rankingRating - a.rankingRating;

      if (ratingComparison !== 0) {
        return ratingComparison;
      }

      const firstNameComparison = a.user.firstName.localeCompare(b.user.firstName);

      if (firstNameComparison !== 0) {
        return firstNameComparison;
      }

      const lastNameComparison = a.user.lastName.localeCompare(b.user.lastName);

      if (lastNameComparison !== 0) {
        return lastNameComparison;
      }

      return a.id.localeCompare(b.id);
    });
  }
}
