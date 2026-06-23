// Single source for the win-rate tint shared by the "melhor dupla" hero and the
// "suas duplas" rows: strong rates read success, middling read brand, weak read
// danger. Returns token classes for the figure and the progress bar.
type PartnerRateTone = {
  text: string;
  bar: string;
};

export function partnerRateTone(winRate: number): PartnerRateTone {
  if (winRate >= 60) {
    return { text: 'text-success', bar: 'bg-success' };
  }

  if (winRate >= 45) {
    return { text: 'text-brand', bar: 'bg-brand' };
  }

  return { text: 'text-danger', bar: 'bg-danger' };
}
