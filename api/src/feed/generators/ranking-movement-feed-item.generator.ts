import { Injectable } from '@nestjs/common';
import {
  FeedItemScope,
  FeedItemType,
  FeedItemVisibility,
} from '../../generated/prisma/enums';
import type { FeedItemDraft } from '../types/feed-item-draft.type';
import type { FeedItemGenerator } from '../types/feed-item-generator.type';
import type {
  RankingMovementFeedHeadlineVariant,
  RankingMovementFeedInput,
  RankingMovementFeedMovement,
  RankingMovementFeedPlayer,
} from '../types/ranking-movement-feed-input.type';

const FEED_MOVEMENT_THRESHOLD = 2;
const BIG_MOVEMENT_THRESHOLD = 4;
const MAX_NAMES_IN_HEADLINE = 2;
const RANKING_MOVEMENT_IMPORTANCE_SCORE = 80;

type MovementVerb = 'sobe' | 'sobem' | 'dispara' | 'disparam' | 'cai' | 'caem' | 'desaba' | 'desabam';

@Injectable()
export class RankingMovementFeedItemGenerator implements FeedItemGenerator<RankingMovementFeedInput> {
  generate(input: RankingMovementFeedInput): FeedItemDraft | null {
    const relevantMovements = this.getRelevantMovements(input);

    if (relevantMovements.length === 0) {
      return null;
    }

    const primaryMovement = relevantMovements[0];
    const headline = this.buildHeadline(input, relevantMovements);

    return {
      type: FeedItemType.RANKING_MOVEMENT,
      scope: FeedItemScope.GROUP,
      visibility: FeedItemVisibility.GROUP_MEMBERS,
      groupId: input.groupId,
      matchId: input.matchId,
      actorUserId: primaryMovement?.userId ?? null,
      actorGroupMemberId: primaryMovement?.groupMemberId ?? null,
      subjectUserId: primaryMovement?.userId ?? null,
      importanceScore: RANKING_MOVEMENT_IMPORTANCE_SCORE,
      occurredAt: input.occurredAt,
      metadata: {
        headline: headline.text,
        headlineVariant: headline.variant,
        winnerTeam: input.winnerTeam,
        gamesA: input.gamesA,
        gamesB: input.gamesB,
        winners: input.winners,
        losers: input.losers,
        movements: relevantMovements,
        leadershipChange: input.leadershipChange ?? null,
      },
    };
  }

  private getRelevantMovements(input: RankingMovementFeedInput) {
    return [...input.movements]
      .filter((movement) => this.isRelevantMovement(movement, input))
      .sort((a, b) => this.compareMovements(a, b));
  }

  private isRelevantMovement(
    movement: RankingMovementFeedMovement,
    input: RankingMovementFeedInput,
  ) {
    if (movement.positions >= FEED_MOVEMENT_THRESHOLD) {
      return true;
    }

    if (movement.direction === 'UP' && movement.currentRank === 1) {
      return true;
    }

    return Boolean(
      input.leadershipChange?.dethronedLeaders.some(
        (leader) => leader.groupMemberId === movement.groupMemberId,
      ),
    );
  }

  private compareMovements(a: RankingMovementFeedMovement, b: RankingMovementFeedMovement) {
    const directionComparison = this.getDirectionWeight(b) - this.getDirectionWeight(a);

    if (directionComparison !== 0) {
      return directionComparison;
    }

    const positionsComparison = b.positions - a.positions;

    if (positionsComparison !== 0) {
      return positionsComparison;
    }

    return a.currentRank - b.currentRank;
  }

  private getDirectionWeight(movement: RankingMovementFeedMovement) {
    return movement.direction === 'UP' ? 2 : 1;
  }

  private buildHeadline(
    input: RankingMovementFeedInput,
    movements: RankingMovementFeedMovement[],
  ): { text: string; variant: RankingMovementFeedHeadlineVariant } {
    const leadershipHeadline = this.buildLeadershipHeadline(input);

    if (leadershipHeadline) {
      return {
        text: leadershipHeadline,
        variant: 'LEADERSHIP_CHANGED',
      };
    }

    const upMovements = movements.filter((movement) => movement.direction === 'UP');
    const downMovements = movements.filter((movement) => movement.direction === 'DOWN');

    if (upMovements.length > 0 && downMovements.length > 0) {
      if (this.hasMixedIntensity(upMovements) && this.hasMixedIntensity(downMovements)) {
        return {
          text: 'O ranking virou do avesso depois da partida',
          variant: 'RANKING_TURNED_UPSIDE_DOWN',
        };
      }

      return {
        text: `${this.buildMovementPhrase(upMovements)} enquanto ${this.buildMovementPhrase(downMovements)}`,
        variant: 'MIXED',
      };
    }

    if (upMovements.length > 0) {
      return {
        text: this.buildOnlyUpHeadline(upMovements),
        variant: upMovements.length === 1 ? 'SINGLE_UP' : 'DOUBLE_UP',
      };
    }

    return {
      text: `${this.buildMovementPhrase(downMovements)} no ranking`,
      variant: downMovements.length === 1 ? 'SINGLE_DOWN' : 'DOUBLE_DOWN',
    };
  }

  private buildLeadershipHeadline(input: RankingMovementFeedInput) {
    const leadershipChange = input.leadershipChange;

    if (!leadershipChange || leadershipChange.currentLeaders.length === 0) {
      return null;
    }

    const currentLeadersText = this.formatNames(leadershipChange.currentLeaders);
    const previousLeadersText = this.formatNames(leadershipChange.previousLeaders);
    const dethronedLeadersText = this.formatNames(leadershipChange.dethronedLeaders);

    if (leadershipChange.dethronedLeaders.length > 0) {
      return `${dethronedLeadersText} ${this.getConjugatedVerb(
        leadershipChange.dethronedLeaders,
        'cai',
        'caem',
      )} da liderança e ${currentLeadersText} ${this.getConjugatedVerb(
        leadershipChange.currentLeaders,
        'assume',
        'assumem',
      )} o topo`;
    }

    const directLeaderPass = input.movements.some(
      (movement) =>
        movement.direction === 'UP' &&
        movement.currentRank === 1 &&
        movement.affectedMembers.some((member) =>
          leadershipChange.previousLeaders.some(
            (leader) => leader.groupMemberId === member.groupMemberId,
          ),
        ),
    );

    if (directLeaderPass && leadershipChange.previousLeaders.length > 0) {
      return `${currentLeadersText} ${this.getConjugatedVerb(
        leadershipChange.currentLeaders,
        'passa',
        'passam',
      )} ${previousLeadersText} e ${this.getConjugatedVerb(
        leadershipChange.currentLeaders,
        'assume',
        'assumem',
      )} a liderança`;
    }

    if (leadershipChange.previousLeaders.length > 0) {
      return `${currentLeadersText} ${this.getConjugatedVerb(
        leadershipChange.currentLeaders,
        'assume',
        'assumem',
      )} a liderança que era de ${previousLeadersText}`;
    }

    return `${currentLeadersText} ${this.getConjugatedVerb(
      leadershipChange.currentLeaders,
      'assume',
      'assumem',
    )} a liderança`;
  }

  private buildOnlyUpHeadline(movements: RankingMovementFeedMovement[]) {
    if (movements.length === 1) {
      const movement = movements[0];
      const verb = this.getMovementVerb([movement]);

      if (movement.affectedMembers.length > 0 && movement.affectedMembers.length <= MAX_NAMES_IN_HEADLINE) {
        return `${movement.displayName} passa ${this.formatNames(movement.affectedMembers)} e ${verb} no ranking`;
      }

      return `${movement.displayName} ${verb} no ranking`;
    }

    return `${this.buildMovementPhrase(movements)} no ranking`;
  }

  private buildMovementPhrase(movements: RankingMovementFeedMovement[]) {
    const sortedMovements = [...movements].sort((a, b) => this.compareMovements(a, b));

    if (sortedMovements.length === 1) {
      const movement = sortedMovements[0];
      return `${movement.displayName} ${this.getMovementVerb([movement])}`;
    }

    if (!this.hasMixedIntensity(sortedMovements)) {
      return `${this.formatNames(sortedMovements)} ${this.getMovementVerb(sortedMovements)}`;
    }

    return sortedMovements
      .map((movement) => `${movement.displayName} ${this.getMovementVerb([movement])}`)
      .join(' e ');
  }

  private hasMixedIntensity(movements: RankingMovementFeedMovement[]) {
    return new Set(movements.map((movement) => this.getMovementIntensity(movement))).size > 1;
  }

  private getMovementIntensity(movement: RankingMovementFeedMovement) {
    return movement.positions >= BIG_MOVEMENT_THRESHOLD ? 'BIG' : 'REGULAR';
  }

  private getMovementVerb(movements: RankingMovementFeedMovement[]): MovementVerb {
    const direction = movements[0]?.direction ?? 'UP';
    const isPlural = movements.length > 1;
    const isBig = movements.some((movement) => movement.positions >= BIG_MOVEMENT_THRESHOLD);

    if (direction === 'UP') {
      if (isBig) {
        return isPlural ? 'disparam' : 'dispara';
      }

      return isPlural ? 'sobem' : 'sobe';
    }

    if (isBig) {
      return isPlural ? 'desabam' : 'desaba';
    }

    return isPlural ? 'caem' : 'cai';
  }

  private formatNames(players: RankingMovementFeedPlayer[]) {
    if (players.length === 0) {
      return '';
    }

    if (players.length === 1) {
      return players[0].displayName;
    }

    const displayNames = players.map((player) => player.displayName);
    const lastName = displayNames[displayNames.length - 1];
    return `${displayNames.slice(0, -1).join(', ')} e ${lastName}`;
  }

  private getConjugatedVerb<T>(items: T[], singular: string, plural: string) {
    return items.length === 1 ? singular : plural;
  }
}
