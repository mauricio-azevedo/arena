// Shapes a user row to `accountSchema` (`@arena/contracts/auth`): the account's
// own view, answered by register, login, `GET /auth/me` and `PATCH /me/profile`.
// Selecting the columns by name is what keeps `passwordHash` off the wire, and
// adding a column to the account payload happens here once.
export const ACCOUNT_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  nickname: true,
  email: true,
  avatarColor: true,
  createdAt: true,
  updatedAt: true,
} as const;
