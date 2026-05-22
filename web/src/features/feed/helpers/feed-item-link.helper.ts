import type { FeedItem } from '../types/feed-item.type';

export function getFeedItemHref(item: FeedItem) {
  if (item.group) {
    return `/groups/${item.group.id}?returnTo=${encodeURIComponent('/')}`;
  }

  if (item.subjectUserId) {
    return `/profile`;
  }

  return '/';
}
