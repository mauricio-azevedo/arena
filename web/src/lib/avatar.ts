// Avatar helpers shared across features (match drawer, ranking, …).

// Literal class strings (not interpolated) so Tailwind keeps them in the build.
const AVATAR_BG_CLASSES = ['bg-avatar-1', 'bg-avatar-2', 'bg-avatar-3', 'bg-avatar-4'] as const;

// Deterministic fill for the claim flow's account avatars (which have no
// avatarColor in their payload). Player avatars elsewhere use MemberAvatar.
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

// The initials shown inside a player avatar. `count` 2 → first + last word (the
// default); 1 → first word only. A single-word name yields one letter either way.
export function memberInitials(name: string, count: 1 | 2 = 2): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return '?';
  }

  const first = words[0].charAt(0);

  if (count === 1 || words.length === 1) {
    return first.toUpperCase();
  }

  return (first + words[words.length - 1].charAt(0)).toUpperCase();
}
