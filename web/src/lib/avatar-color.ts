// The user-pickable avatar palette. The backend stores only the key
// (User.avatarColor); the gradient lives here so the UI is the single source.
// Raw hex (the sanctioned multi-hue exception, like highlight-style.ts).
type AvatarColor = { key: string; from: string; to: string };

export const AVATAR_COLORS: AvatarColor[] = [
  { key: 'blue', from: '#3a78d6', to: '#2350a0' },
  { key: 'green', from: '#1f8a5b', to: '#14613e' },
  { key: 'teal', from: '#2bb3c0', to: '#1b818c' },
  { key: 'amber', from: '#e0934a', to: '#c4682a' },
  { key: 'red', from: '#e0584a', to: '#b3382c' },
  { key: 'magenta', from: '#d36be0', to: '#9e3fae' },
  { key: 'violet', from: '#7c5cd6', to: '#553bab' },
  { key: 'gold', from: '#e0b54a', to: '#c08f24' },
];

export const AVATAR_COLOR_KEYS = AVATAR_COLORS.map((color) => color.key);

// Fallback for a real member whose colour is missing/unknown (API skew, demo
// data) so their avatar is never invisible. Mirrors the backend default.
export const DEFAULT_AVATAR_COLOR = 'blue';

// CSS gradient for a stored key, or null when unset/unknown (caller falls back to
// the deterministic seed fill).
export function avatarColorGradient(key: string | null | undefined): string | null {
  if (!key) {
    return null;
  }

  const color = AVATAR_COLORS.find((entry) => entry.key === key);
  return color ? `linear-gradient(150deg, ${color.from}, ${color.to})` : null;
}
