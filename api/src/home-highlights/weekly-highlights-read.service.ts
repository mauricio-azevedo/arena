import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  MEMBER_USER_SELECT,
  resolveMemberAvatarColor,
  resolveMemberDisplayName,
} from '../common/member-display-name';
import { HighlightType } from '../generated/prisma/enums';

// Read-time selection (spec: docs/product/weekly-highlights.md). The heavy work lives in the
// projection; here we just window, dedupe, and merge. "Your people" is bounded by the viewer's
// membership; the Arena pool is viewer-independent and cached so the common path is cheap.

const WINDOW_DAYS = 7;
const YOUR_PEOPLE_MAX = 5;
const ARENA_WHEN_HAS_PEOPLE = 3;
const TOTAL_MAX = 8;
const MAX_PER_TYPE_PER_PART = 2;
const ARENA_CACHE_TTL_MS = 30_000;
const ARENA_CANDIDATE_POOL = 60;

type Origin = 'GROUP' | 'ARENA';

type HighlightRow = {
  userId: string;
  groupMemberId: string;
  groupId: string;
  type: HighlightType;
  value: number;
  score: number;
  group: { id: string; name: string };
  user: {
    firstName: string;
    lastName: string;
    nickname: string | null;
    avatarColor: string | null;
  };
};

export type WeeklyHighlightCard = {
  userId: string;
  displayName: string;
  avatarColor: string | null;
  groupMemberId: string;
  group: { id: string; name: string };
  achievement: { type: HighlightType; value: number };
  origin: Origin;
};

@Injectable()
export class WeeklyHighlightsReadService {
  private arenaCache: { rows: HighlightRow[]; expiresAt: number } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async getWeeklyHighlights(
    viewerUserId?: string,
  ): Promise<WeeklyHighlightCard[]> {
    const cutoff = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const viewerGroupIds = viewerUserId
      ? (
          await this.prisma.groupMember.findMany({
            where: { userId: viewerUserId, leftAt: null },
            select: { groupId: true },
          })
        ).map((member) => member.groupId)
      : [];

    let yourPeople: WeeklyHighlightCard[] = [];
    if (viewerGroupIds.length > 0) {
      const rows = (await this.prisma.groupHighlight.findMany({
        where: { groupId: { in: viewerGroupIds }, anchorAt: { gte: cutoff } },
        orderBy: { score: 'desc' },
        select: this.rowSelect(),
      })) as HighlightRow[];
      yourPeople = this.selectCards(rows, YOUR_PEOPLE_MAX, 'GROUP');
    }

    const shownUserIds = new Set(yourPeople.map((card) => card.userId));
    const arenaTarget =
      yourPeople.length === 0 ? TOTAL_MAX : ARENA_WHEN_HAS_PEOPLE;

    const arenaRows = await this.getArenaCandidates(cutoff);
    const arena = this.selectCards(arenaRows, arenaTarget, 'ARENA', {
      excludeUserIds: shownUserIds,
      excludeGroupIds: new Set(viewerGroupIds),
    });

    return [...yourPeople, ...arena];
  }

  // Viewer-independent top pool of stranger-worthy moments (higher bar), cached briefly so the
  // common path — including every logged-out request — costs one bounded query per TTL window.
  private async getArenaCandidates(cutoff: Date): Promise<HighlightRow[]> {
    const nowMs = Date.now();
    if (this.arenaCache && this.arenaCache.expiresAt > nowMs) {
      return this.arenaCache.rows;
    }

    const rows = (await this.prisma.groupHighlight.findMany({
      where: {
        anchorAt: { gte: cutoff },
        OR: [
          { type: HighlightType.LEADERSHIP },
          {
            type: {
              in: [
                HighlightType.WIN_STREAK_CURRENT,
                HighlightType.WIN_STREAK_RECORD,
                HighlightType.CLIMB,
              ],
            },
            value: { gte: 5 },
          },
          {
            type: {
              in: [
                HighlightType.MILESTONE_MATCHES,
                HighlightType.MILESTONE_WINS,
              ],
            },
            value: { gte: 50 },
          },
        ],
      },
      orderBy: { score: 'desc' },
      take: ARENA_CANDIDATE_POOL,
      select: this.rowSelect(),
    })) as HighlightRow[];

    this.arenaCache = { rows, expiresAt: nowMs + ARENA_CACHE_TTL_MS };
    return rows;
  }

  // One card per person (their strongest moment), then at most two of a type, up to `max`.
  private selectCards(
    rows: HighlightRow[],
    max: number,
    origin: Origin,
    exclude: { excludeUserIds: Set<string>; excludeGroupIds: Set<string> } = {
      excludeUserIds: new Set(),
      excludeGroupIds: new Set(),
    },
  ): WeeklyHighlightCard[] {
    const bestByUser = new Map<string, HighlightRow>();
    for (const row of rows) {
      if (exclude.excludeUserIds.has(row.userId)) continue;
      if (exclude.excludeGroupIds.has(row.groupId)) continue;
      if (!bestByUser.has(row.userId)) {
        bestByUser.set(row.userId, row);
      }
    }

    const cards: WeeklyHighlightCard[] = [];
    const typeCounts = new Map<HighlightType, number>();
    for (const row of bestByUser.values()) {
      if (cards.length >= max) break;
      const count = typeCounts.get(row.type) ?? 0;
      if (count >= MAX_PER_TYPE_PER_PART) continue;
      typeCounts.set(row.type, count + 1);
      cards.push({
        userId: row.userId,
        displayName: resolveMemberDisplayName({ user: row.user }),
        avatarColor: resolveMemberAvatarColor({ user: row.user }),
        groupMemberId: row.groupMemberId,
        group: { id: row.group.id, name: row.group.name },
        achievement: { type: row.type, value: row.value },
        origin,
      });
    }
    return cards;
  }

  private rowSelect() {
    return {
      userId: true,
      groupMemberId: true,
      groupId: true,
      type: true,
      value: true,
      score: true,
      group: { select: { id: true, name: true } },
      user: {
        select: {
          ...MEMBER_USER_SELECT,
        },
      },
    } as const;
  }
}
