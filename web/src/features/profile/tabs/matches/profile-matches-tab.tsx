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
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          Carregando partidas...
        </CardContent>
      </Card>
    );
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
