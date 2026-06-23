'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageIntro } from '@/components/page-intro';
import { getAccessToken } from '@/lib/auth';
import { getProfileSummary } from './api/profile.api';
import { ProfileEditCard } from './components/profile-edit-card';
import { ProfileErrorState } from './components/profile-error-state';
import { ProfileSignedOutState } from './components/profile-signed-out-state';
import type { ProfileSummary } from './types/profile-summary.type';
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

    async function loadProfile(profileToken: string) {
      try {
        setError('');
        const data = await getProfileSummary(profileToken);
        setSummary(data);
      } catch {
        setError('Não foi possível carregar seus dados agora.');
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile(token);
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
    return null;
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
      <PageIntro description="Atualize seu nome e e-mail." />

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
