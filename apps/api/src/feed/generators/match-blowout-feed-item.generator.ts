import { Injectable } from '@nestjs/common';
import {
  FeedItemScope,
  FeedItemType,
  FeedItemVisibility,
} from '../../generated/prisma/enums';
import type { FeedItemDraft } from '../types/feed-item-draft.type';
import type { FeedItemGenerator } from '../types/feed-item-generator.type';
import type { MatchBlowoutFeedInput } from '../types/match-blowout-feed-input.type';

const BLOWOUT_WINNER_SCORE = 6;
const BLOWOUT_MAX_LOSER_SCORE = 1;

@Injectable()
export class MatchBlowoutFeedItemGenerator implements FeedItemGenerator<MatchBlowoutFeedInput> {
  generate(input: MatchBlowoutFeedInput): FeedItemDraft | null {
    const winnerScore = Math.max(input.gamesA, input.gamesB);
    const loserScore = Math.min(input.gamesA, input.gamesB);

    if (
      winnerScore !== BLOWOUT_WINNER_SCORE ||
      loserScore > BLOWOUT_MAX_LOSER_SCORE
    ) {
      return null;
    }

    const primaryWinner = input.winners[0];

    return {
      type: FeedItemType.MATCH_BLOWOUT,
      scope: FeedItemScope.GROUP,
      visibility: FeedItemVisibility.GROUP_MEMBERS,
      groupId: input.groupId,
      matchId: input.matchId,
      actorUserId: primaryWinner?.userId ?? null,
      actorGroupMemberId: primaryWinner?.groupMemberId ?? null,
      subjectUserId: primaryWinner?.userId ?? null,
      importanceScore: loserScore === 0 ? 70 : 60,
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
