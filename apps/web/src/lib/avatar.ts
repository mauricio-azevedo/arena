// Avatar helpers shared across features (match drawer, ranking, …).

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
