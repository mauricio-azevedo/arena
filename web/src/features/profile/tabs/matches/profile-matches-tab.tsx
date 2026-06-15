'use client';

import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import type { ProfileMatchListItem } from './types/profile-match-list-item.type';
import { ProfileMatchesList } from './sections/profile-matches-list';
import { getProfileMatches } from './api/profile-matches.api';
import { getPublicProfileMatches } from '@/features/profile/api/profile-user.api';

type Props = {
  userId?: string;
};

export function ProfileMatchesTab({ userId }: Props) {
  const [matches, setMatches] = useState<ProfileMatchListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getAccessToken();

    if (!token && !userId) {
      setIsLoading(false);
      return;
    }

    async function loadMatches() {
      try {
        setError('');
        const data = userId
          ? await getPublicProfileMatches(userId)
          : await getProfileMatches(token as string);
        setMatches(data);
      } catch {
        setError('Não foi possível carregar as partidas.');
      } finally {
        setIsLoading(false);
      }
    }

    loadMatches();
  }, [userId]);

  if (isLoading) {
    return <ProfileMatchesLoadingState />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">{error}</CardContent>
      </Card>
    );
  }

  return <ProfileMatchesList matches={matches} />;
}

function ProfileMatchesLoadingState() {
  return (
    <section className="space-y-3" aria-label="Carregando partidas">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="rounded-[1.75rem] bg-gradient-to-br from-card via-card to-primary/8">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
              <div className="h-3 w-40 animate-pulse rounded-full bg-muted/70" />
            </div>
            <div className="h-5 w-full animate-pulse rounded-full bg-muted" />
            <div className="h-10 animate-pulse rounded-[1.25rem] bg-muted/70" />
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
