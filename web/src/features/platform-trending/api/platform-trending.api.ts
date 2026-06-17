import { apiRequest } from '@/lib/api-client';
import type { PlatformTrendingPlayer } from '@/features/platform-trending/types/platform-trending-player.type';

export function getPlatformTrendingPlayers(): Promise<PlatformTrendingPlayer[]> {
  return apiRequest<PlatformTrendingPlayer[]>('/platform/trending-players', {
    cache: 'no-store',
  });
}
