// Single source for how a WIN/LOSS result reads on the profile "forma recente"
// strip — the pt-BR V/D label and its semantic tint. Keep all result→UI mapping
// here, never inline per screen.
type MatchResult = 'WIN' | 'LOSS';

type RecentFormChip = {
  label: 'V' | 'D';
  className: string;
};

export function recentFormChip(result: MatchResult): RecentFormChip {
  return result === 'WIN'
    ? { label: 'V', className: 'bg-success/15 text-success ring-1 ring-inset ring-success/20' }
    : { label: 'D', className: 'bg-danger/15 text-danger ring-1 ring-inset ring-danger/20' };
}
