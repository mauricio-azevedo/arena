'use client';

import { useEffect, useState } from 'react';
import { getGroupHome } from '@/features/groups/api/groups.api';
import type { GroupHomeCard } from '@/features/groups/types/group-home.type';
import { WeeklyHighlightsRail } from '@/features/weekly-highlights/components/weekly-highlights-rail';
import { useAccessToken } from '@/hooks/use-access-token';
import { GroupsSection } from './groups-section';
import { HomeSearchPlaceholder } from './home-search-placeholder';

type HomeState =
  { status: 'loading' } | { status: 'ready'; cards: GroupHomeCard[] } | { status: 'error' };

export function HomeScreen() {
  const token = useAccessToken();
  const [home, setHome] = useState<HomeState>({ status: 'loading' });

  useEffect(() => {
    // Storage not readable yet (hydration): wait for the token or null.
    if (token === undefined) return;

    let isCurrent = true;

    getGroupHome(token ?? undefined)
      .then((cards) => {
        if (isCurrent) setHome({ status: 'ready', cards });
      })
      .catch(() => {
        if (isCurrent) setHome({ status: 'error' });
      });

    return () => {
      isCurrent = false;
    };
  }, [token]);

  return (
    <div className="space-y-section">
      <HomeSearchPlaceholder />
      <WeeklyHighlightsRail />
      <GroupsSection
        status={home.status}
        cards={home.status === 'ready' ? home.cards : []}
        isLoggedIn={Boolean(token)}
      />
    </div>
  );
}
