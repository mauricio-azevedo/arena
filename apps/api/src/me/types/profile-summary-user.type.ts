export type ProfileSummaryUser = {
  id: string;
  firstName: string;
  lastName: string;
  // Display name shown to others when set; drives the profile handle line.
  nickname: string | null;
  email: string | null;
  // Avatar gradient palette key (frontend maps key→gradient). Always set.
  avatarColor: string;
  // Account creation date, surfaced as the "desde …" line on the profile.
  memberSince: Date;
};
