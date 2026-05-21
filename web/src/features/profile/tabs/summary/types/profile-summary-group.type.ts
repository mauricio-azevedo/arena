export type ProfileSummaryGroup = {
  id: string;
  name: string;
  description: string | null;
  rating: number;
  role: 'ADMIN' | 'MEMBER';
  lastPlayedAt: string | null;
};
