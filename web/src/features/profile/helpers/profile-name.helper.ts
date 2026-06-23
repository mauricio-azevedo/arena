// Single source for the first-name shown on the profile (best-partner title,
// partner rows). Pairs with `nameInitial` (lib/avatar) for the monogram so the
// label and its initial always agree.
export function firstNameOf(name: string): string {
  const trimmed = name.trim();
  return trimmed.split(/\s+/)[0] || trimmed;
}
