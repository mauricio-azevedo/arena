import { Injectable } from '@nestjs/common';
import {
  FeedItemScope,
  FeedItemType,
  FeedItemVisibility,
} from '../../generated/prisma/enums';
import type { FeedItemDraft } from '../types/feed-item-draft.type';
import type { FeedItemGenerator } from '../types/feed-item-generator.type';
import type { MatchCloseFeedInput } from '../types/match-close-feed-input.type';

const CLOSE_MATCH_WINNER_SCORE = 7;
const CLOSE_MATCH_LOSER_SCORE = 6;

@Injectable()
export class MatchCloseFeedItemGenerator implements FeedItemGenerator<MatchCloseFeedInput> {
  generate(input: MatchCloseFeedInput): FeedItemDraft | null {
    const winnerScore = Math.max(input.gamesA, input.gamesB);
    const loserScore = Math.min(input.gamesA, input.gamesB);

    if (
      winnerScore !== CLOSE_MATCH_WINNER_SCORE ||
      loserScore !== CLOSE_MATCH_LOSER_SCORE
    ) {
      return null;
    }

    const primaryWinner = input.winners[0];

    return {
      type: FeedItemType.MATCH_CLOSE,
      scope: FeedItemScope.GROUP,
      visibility: FeedItemVisibility.GROUP_MEMBERS,
      groupId: input.groupId,
      matchId: input.matchId,
      actorUserId: primaryWinner?.userId ?? null,
      actorGroupMemberId: primaryWinner?.groupMemberId ?? null,
      subjectUserId: primaryWinner?.userId ?? null,
      importanceScore: 55,
      occurredAt: input.occurredAt,
      metadata: {
        winnerTeam: input.winnerTeam,
        gamesA: input.gamesA,
        gamesB: input.gamesB,
        winners: input.winners,
        losers: input.losers,
      },
    };
  }
}
