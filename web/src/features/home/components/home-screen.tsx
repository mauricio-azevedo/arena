'use client';

import { useEffect, useState } from 'react';
import { getGroupHome } from '@/features/groups/api/groups.api';
import type { GroupHomeCard } from '@/features/groups/types/group-home.type';
import { WeeklyHighlightsRail } from '@/features/weekly-highlights/components/weekly-highlights-rail';
import { getAccessToken } from '@/lib/auth';
import { GroupsSection } from './groups-section';
import { HomeSearchPlaceholder } from './home-search-placeholder';

type Status = 'loading' | 'ready' | 'error';

export function HomeScreen() {
  const [status, setStatus] = useState<Status>('loading');
  const [cards, setCards] = useState<GroupHomeCard[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    const token = getAccessToken() ?? undefined;
    setIsLoggedIn(Boolean(token));
    setStatus('loading');

    getGroupHome(token)
      .then((home) => {
        if (isCurrent) {
          setCards(home);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (isCurrent) setStatus('error');
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <div className="space-y-section">
      <HomeSearchPlaceholder />
      <WeeklyHighlightsRail />
      <GroupsSection status={status} cards={cards} isLoggedIn={isLoggedIn} />
    </div>
  );
}
