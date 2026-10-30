import { apiRequest } from '@/lib/api-client';
import type { WeeklyHighlightCard } from '@arena/contracts/weekly-highlights';

export function getWeeklyHighlights(token?: string): Promise<WeeklyHighlightCard[]> {
  return apiRequest<WeeklyHighlightCard[]>('/home/weekly-highlights', {
    token,
    cache: 'no-store',
  });
}
