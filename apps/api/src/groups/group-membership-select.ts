// Shapes a membership to `groupMembershipResponseSchema`: role and rating, not
// the competitive state `GET /groups/:groupId/members` answers. `GET /me/groups`
// and `GET /users/:userId/groups` send the same payload, for the caller and for
// another account, so the select lives with the group contract, not in either.
export const GROUP_MEMBERSHIP_SELECT = {
  id: true,
  groupId: true,
  role: true,
  rating: true,
  createdAt: true,
  updatedAt: true,
  // Every `Group` column is promised by `groupSchema`.
  group: true,
} as const;
