import type { GroupMemberRole } from '../../generated/prisma/enums';

export type ProfileSummaryGroup = {
  id: string;
  name: string;
  description: string | null;
  rating: number;
  role: GroupMemberRole;
  lastPlayedAt: Date | null;
};
