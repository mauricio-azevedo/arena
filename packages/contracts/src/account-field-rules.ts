// What a name, a nickname, an e-mail and a password may be. Plain values and no
// zod, so the web imports them from `@arena/contracts` directly (the root stays
// zod-free, code-organization §3.3) and its forms check the same numbers the
// schemas in `./auth` and `./me` enforce. Before this module the web re-typed
// all four by hand, with the password minimum written twice and the nickname cap
// and e-mail pattern three times each.
//
// Caps are shape — the column's width, which a form can guard before submitting.
// A rule the UI must react to differently answers with a code from the service
// instead (`PASSWORD_TOO_SHORT`, `EMAIL_IN_USE`).

export const MAX_NAME_LENGTH = 80;
export const MAX_NICKNAME_LENGTH = 24;
export const MAX_EMAIL_LENGTH = 254;

export const MIN_PASSWORD_LENGTH = 6;

// bcrypt hashes the first 72 bytes and ignores the rest, so a longer password
// would silently authenticate on its prefix.
export const MAX_PASSWORD_BYTES = 72;

// Deliberately looser than `z.email()`: both apps check this exact pattern, and
// a stricter one on the API would reject what the form just accepted.
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
