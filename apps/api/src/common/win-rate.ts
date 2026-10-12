// Win percentage rounded to a whole number (0–100); 0 when no matches have been
// played. Shared so every profile/stats surface rounds win rate the same way.
export function winRatePercent(wins: number, total: number): number {
  return total === 0 ? 0 : Math.round((wins / total) * 100);
}
