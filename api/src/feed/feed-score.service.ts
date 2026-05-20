import { Injectable } from '@nestjs/common';

const ONE_HOUR_IN_MS = 1000 * 60 * 60;
const SIX_HOURS_IN_MS = ONE_HOUR_IN_MS * 6;
const ONE_DAY_IN_MS = ONE_HOUR_IN_MS * 24;
const THREE_DAYS_IN_MS = ONE_DAY_IN_MS * 3;

@Injectable()
export class FeedScoreService {
  calculateFeedScore(input: { importanceScore: number; occurredAt: Date }) {
    return input.importanceScore + this.calculateRecencyScore(input.occurredAt);
  }

  private calculateRecencyScore(occurredAt: Date) {
    const ageInMs = Date.now() - occurredAt.getTime();

    if (ageInMs <= ONE_HOUR_IN_MS) {
      return 40;
    }

    if (ageInMs <= SIX_HOURS_IN_MS) {
      return 30;
    }

    if (ageInMs <= ONE_DAY_IN_MS) {
      return 20;
    }

    if (ageInMs <= THREE_DAYS_IN_MS) {
      return 10;
    }

    return 0;
  }
}
