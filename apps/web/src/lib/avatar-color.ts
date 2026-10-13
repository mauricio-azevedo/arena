import { AVATAR_COLOR_KEYS, isAvatarColorKey, type AvatarColorKey } from '@arena/contracts';

// The user-pickable avatar palette. The API stores only the key (User.avatarColor,
// Group.avatarColor); the gradient lives here so the UI is the single source.
// Raw hex (the sanctioned multi-hue exception, like highlight-style.ts).
type Gradient = { from: string; to: string };

// Keyed by the contract so a key added there without a gradient here fails to compile.
const GRADIENTS: Record<AvatarColorKey, Gradient> = {
  blue: { from: '#3a78d6', to: '#2350a0' },
  green: { from: '#1f8a5b', to: '#14613e' },
  teal: { from: '#2bb3c0', to: '#1b818c' },
  amber: { from: '#e0934a', to: '#c4682a' },
  red: { from: '#e0584a', to: '#b3382c' },
  magenta: { from: '#d36be0', to: '#9e3fae' },
  violet: { from: '#7c5cd6', to: '#553bab' },
  gold: { from: '#e0b54a', to: '#c08f24' },
};

// Picker order is the contract's order.
export const AVATAR_COLORS = AVATAR_COLOR_KEYS.map((key) => ({ key, ...GRADIENTS[key] }));

// Fallback for a real member whose colour is missing/unknown (API skew, demo
// data) so their avatar is never invisible.
export const DEFAULT_AVATAR_COLOR: AvatarColorKey = 'blue';

// CSS gradient for a stored key, or null when unset/unknown (caller falls back to
// the deterministic seed fill).
export function avatarColorGradient(key: string | null | undefined): string | null {
  if (!key || !isAvatarColorKey(key)) {
    return null;
  }

  const { from, to } = GRADIENTS[key];
  return `linear-gradient(150deg, ${from}, ${to})`;
}
