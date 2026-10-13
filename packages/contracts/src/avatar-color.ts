// The avatar palette, by key. The API stores and validates the key (User.avatarColor,
// Group.avatarColor); the web app owns each key's gradient. Order is the picker order
// and the modulus for the API's deterministic default, so append — never reorder.
export const AVATAR_COLOR_KEYS = [
  'blue',
  'green',
  'teal',
  'amber',
  'red',
  'magenta',
  'violet',
  'gold',
] as const;

export type AvatarColorKey = (typeof AVATAR_COLOR_KEYS)[number];

export function isAvatarColorKey(value: string): value is AvatarColorKey {
  return (AVATAR_COLOR_KEYS as readonly string[]).includes(value);
}
