import { apiRequest } from '@/lib/api-client';
import { FeedItem } from '@/features/feed/types/feed-item.type';

export function getFeed(token: string): Promise<FeedItem[]> {
  return apiRequest<FeedItem[]>('/feed', {
    token,
    cache: 'no-store',
  });
}
