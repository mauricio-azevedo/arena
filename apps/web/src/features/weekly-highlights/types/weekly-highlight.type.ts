export type HighlightType =
  | 'WIN_STREAK_CURRENT'
  | 'WIN_STREAK_RECORD'
  | 'CLIMB'
  | 'LEADERSHIP'
  | 'MILESTONE_MATCHES'
  | 'MILESTONE_WINS';

export type WeeklyHighlightCard = {
  userId: string;
  displayName: string;
  avatarColor: string | null;
  groupMemberId: string;
  group: { id: string; name: string };
  achievement: { type: HighlightType; value: number };
  origin: 'GROUP' | 'ARENA';
};
