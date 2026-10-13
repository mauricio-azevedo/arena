// Single source for the first-name shown on the profile (best-partner title,
// partner rows). Pairs with the avatar's initials so label + avatar agree.
export function firstNameOf(name: string): string {
  const trimmed = name.trim();
  return trimmed.split(/\s+/)[0] || trimmed;
}
