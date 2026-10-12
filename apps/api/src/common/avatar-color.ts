// Avatar palette keys (the frontend owns each key→gradient; the backend only stores
// and validates the key). Keep this list and its order in sync with the SQL backfill
// migration and web/src/lib/avatar-color.ts.
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

// A deterministic, varied default so new accounts aren't all the same colour. Every
// account gets one at registration — there is no "no colour" state.
export function pickDefaultAvatarColor(seed: string): AvatarColorKey {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return AVATAR_COLOR_KEYS[hash % AVATAR_COLOR_KEYS.length];
}
