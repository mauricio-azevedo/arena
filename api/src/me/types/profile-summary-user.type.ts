export type ProfileSummaryUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  // Account creation date, surfaced as the "desde …" line on the profile.
  memberSince: Date;
};
