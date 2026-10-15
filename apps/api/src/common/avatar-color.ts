import { AVATAR_COLOR_KEYS, type AvatarColorKey } from '@arena/contracts';

// A deterministic, varied default so new accounts aren't all the same colour. Every
// account gets one at registration — there is no "no colour" state.
export function pickDefaultAvatarColor(seed: string): AvatarColorKey {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return AVATAR_COLOR_KEYS[hash % AVATAR_COLOR_KEYS.length];
}
