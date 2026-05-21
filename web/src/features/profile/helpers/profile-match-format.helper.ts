import type { ProfileSummaryMatch } from '../tabs/summary/types/profile-summary-match.type';

export function formatProfileMatchScore(match: ProfileSummaryMatch) {
  return `${match.gamesA}–${match.gamesB}`;
}

export function formatProfileMatchResult(result: ProfileSummaryMatch['result']) {
  return result === 'WIN' ? 'Vitória' : 'Derrota';
}
