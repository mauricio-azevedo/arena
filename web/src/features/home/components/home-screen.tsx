'use client';

import { useEffect, useState } from 'react';
import { getMe } from '@/features/auth/api/auth.api';
import { getGroupHome } from '@/features/groups/api/groups.api';
import type { GroupHomeCard } from '@/features/groups/types/group-home.type';
import { WeeklyHighlightsRail } from '@/features/weekly-highlights/components/weekly-highlights-rail';
import { getAccessToken } from '@/lib/auth';
import { GroupsSection } from './groups-section';
import { HomeHeader } from './home-header';
import { HomeSearchPlaceholder } from './home-search-placeholder';

type Status = 'loading' | 'ready' | 'error';

export function HomeScreen() {
  const [status, setStatus] = useState<Status>('loading');
  const [firstName, setFirstName] = useState<string>();
  const [cards, setCards] = useState<GroupHomeCard[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      setStatus('loading');
      const token = getAccessToken() ?? undefined;
      setIsLoggedIn(Boolean(token));

      try {
        const [home, me] = await Promise.all([
          getGroupHome(token),
          token ? getMe(token).catch(() => null) : Promise.resolve(null),
        ]);

        if (!isCurrent) {
          return;
        }

        setCards(home);
        setFirstName(me?.firstName);
        setStatus('ready');
      } catch {
        if (!isCurrent) {
          return;
        }

        setStatus('error');
      }
    }

    load();

    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <HomeHeader firstName={firstName} isLoggedIn={isLoggedIn} loading={status === 'loading'} />
        <HomeSearchPlaceholder />
      </div>
      <WeeklyHighlightsRail />
      <GroupsSection status={status} cards={cards} isLoggedIn={isLoggedIn} />
    </div>
  );
}
