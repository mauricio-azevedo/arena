'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getAccessToken } from '@/lib/auth';
import { getProfileSummary } from './api/profile.api';
import { ProfileEditCard } from './components/profile-edit-card';
import { ProfileErrorState } from './components/profile-error-state';
import { ProfileLoadingState } from './components/profile-loading-state';
import { ProfileSignedOutState } from './components/profile-signed-out-state';
import type { ProfileSummary } from './tabs/summary/types/profile-summary.type';
import type { ProfileUser } from './types/profile-user.type';

export function ProfileEditSettings() {
  const router = useRouter();

  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getAccessToken();
    setAccessToken(token);

    if (!token) {
      setIsLoading(false);
      return;
    }

    async function loadProfile() {
      try {
        setError('');
        const data = await getProfileSummary(token);
        setSummary(data);
      } catch {
        setError('Não foi possível carregar seus dados agora.');
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

  function handleSaved(user: ProfileUser) {
    setSummary((currentSummary) => {
      if (!currentSummary) {
        return currentSummary;
      }

      return {
        ...currentSummary,
        user: {
          ...currentSummary.user,
          ...user,
        },
      };
    });
  }

  if (isLoading) {
    return <ProfileLoadingState />;
  }

  if (!accessToken) {
    return <ProfileSignedOutState />;
  }

  if (error) {
    return <ProfileErrorState error={error} />;
  }

  if (!summary) {
    return <ProfileErrorState error="Perfil não encontrado." />;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Button
          type="button"
          variant="ghost"
          className="-ml-3 h-9 px-3 text-sm text-muted-foreground"
          onClick={() => router.push('/profile/settings')}
        >
          Voltar para configurações
        </Button>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/75">
            Perfil
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.06em]">Alterar perfil</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Atualize como seu nome aparece no BeachRank e o e-mail usado para entrar.
          </p>
        </div>
      </header>

      <ProfileEditCard
        token={accessToken}
        user={summary.user}
        onCancel={() => router.push('/profile/settings')}
        onSaved={handleSaved}
        onTokenRefreshed={setAccessToken}
      />
    </div>
  );
}
