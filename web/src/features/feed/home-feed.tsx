'use client';

import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/auth';
import { getFeed } from '@/features/feed/feed.api';
import { FeedItem } from '@/features/feed/types/feed-item.type';
import { FeedLoadingState } from '@/features/feed/components/feed-loading-state';
import { SignedOutFeedState } from '@/features/feed/components/signed-out-feed-state';
import { FeedErrorState } from '@/features/feed/components/feed-error-state';
import { EmptyFeedState } from '@/features/feed/components/empty-feed-state';
import { FeedItemCard } from '@/features/feed/components/feed-item-card';

export function HomeFeed() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      setHasToken(false);
      setIsLoading(false);
      return;
    }

    setHasToken(true);

    async function loadFeed(authToken: string) {
      try {
        setError('');
        const data = await getFeed(authToken);
        setFeedItems(data);
      } catch {
        setError('Não foi possível carregar o feed agora.');
      } finally {
        setIsLoading(false);
      }
    }

    loadFeed(token);
  }, []);

  if (isLoading) {
    return <FeedLoadingState />;
  }

  if (!hasToken) {
    return <SignedOutFeedState />;
  }

  if (error) {
    return <FeedErrorState error={error} />;
  }

  if (feedItems.length === 0) {
    return <EmptyFeedState />;
  }

  return (
    <section className="space-y-3">
      {feedItems.map((item) => (
        <FeedItemCard key={item.id} item={item} />
      ))}
    </section>
  );
}
