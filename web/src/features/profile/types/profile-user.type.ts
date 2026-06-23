export type ProfileUser = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  // Account creation date ("desde …"). ISO string over the wire.
  memberSince?: string;
};
