import { apiRequest } from '@/lib/api-client';
import type { WeeklyHighlightCard } from '@/features/weekly-highlights/types/weekly-highlight.type';

export function getWeeklyHighlights(
  token?: string,
): Promise<WeeklyHighlightCard[]> {
  return apiRequest<WeeklyHighlightCard[]>('/home/weekly-highlights', {
    token,
    cache: 'no-store',
  });
}
