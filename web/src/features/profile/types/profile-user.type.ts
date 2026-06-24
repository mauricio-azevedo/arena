export type ProfileUser = {
  id: string;
  firstName: string;
  lastName: string;
  // Display name shown to others when set; drives the profile handle line.
  nickname?: string | null;
  email?: string | null;
  // Avatar gradient palette key (see lib/avatar-color); null = default fill.
  avatarColor?: string | null;
  // Account creation date ("desde …"). ISO string over the wire.
  memberSince?: string;
};
