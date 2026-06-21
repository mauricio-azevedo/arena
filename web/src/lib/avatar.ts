// Avatar helpers shared across features (match drawer, ranking, …).

// Literal class strings (not interpolated) so Tailwind keeps them in the build.
const AVATAR_BG_CLASSES = ['bg-avatar-1', 'bg-avatar-2', 'bg-avatar-3', 'bg-avatar-4'] as const;

// Stable per-member colour so a player keeps the same avatar fill everywhere
// (ranking row, picker, team cards). Seed with a stable id, not a name.
export function avatarBgClass(seed: string): string {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return AVATAR_BG_CLASSES[hash % AVATAR_BG_CLASSES.length];
}

export function nameInitial(name: string): string {
  return (name.trim().charAt(0) || '?').toUpperCase();
}
