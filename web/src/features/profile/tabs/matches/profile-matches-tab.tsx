'use client';

import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import type { ProfileMatchListItem } from './types/profile-match-list-item.type';
import { ProfileMatchesList } from './sections/profile-matches-list';
import { getProfileMatches } from '@/features/profile/tabs/matches/profile-matches.api';

export function ProfileMatchesTab() {
  const [matches, setMatches] = useState<ProfileMatchListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      setIsLoading(false);
      return;
    }

    async function loadMatches(authToken: string) {
      try {
        setError('');
        const data = await getProfileMatches(authToken);
        setMatches(data);
      } catch {
        setError('Não foi possível carregar suas partidas.');
      } finally {
        setIsLoading(false);
      }
    }

    loadMatches(token);
  }, []);

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
