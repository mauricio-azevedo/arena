'use client';

import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/auth';
import { getProfileSummary } from './api/profile.api';
import { getPublicProfileSummary } from './api/profile-user.api';
import type { ProfileSummary } from './tabs/summary/types/profile-summary.type';
import { ProfileErrorState } from './components/profile-error-state';
import { ProfileHeader } from './components/profile-header';
import { ProfileLoadingState } from './components/profile-loading-state';
import { ProfileSignedOutState } from './components/profile-signed-out-state';
import { ProfileTabs } from './components/profile-tabs';
import { ProfileGroupsTab } from './tabs/groups/profile-groups-tab';
import { ProfileMatchesTab } from './tabs/matches/profile-matches-tab';
import { ProfileStatsTab } from './tabs/stats/profile-stats-tab';
import { ProfileSummaryTab } from './tabs/summary/profile-summary-tab';
import type { ProfileTab } from '@/features/profile/types/profile-tab.type';

type Props = {
  userId?: string;
};

export function Profile({ userId }: Props) {
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('summary');
  const [isLoading, setIsLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [error, setError] = useState('');

  const isPublicProfile = Boolean(userId);

  useEffect(() => {
    const token = getAccessToken();

    if (!token && !isPublicProfile) {
      setHasToken(false);
      setIsLoading(false);
      return;
    }

    setHasToken(Boolean(token));

    async function loadProfile() {
      try {
        setError('');

        const data = userId
          ? await getPublicProfileSummary(userId)
          : await getProfileSummary(token as string);

        setSummary(data);
      } catch {
        setError(
          isPublicProfile
            ? 'Não foi possível carregar este perfil agora.'
            : 'Não foi possível carregar seu perfil agora.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [isPublicProfile, userId]);

  if (isLoading) {
    return <ProfileLoadingState />;
  }

  if (!hasToken && !isPublicProfile) {
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
      <ProfileHeader user={summary.user} isPublicProfile={isPublicProfile} />
      <ProfileTabs activeTab={activeTab} onChange={setActiveTab} />
      {activeTab === 'summary' && (
        <ProfileSummaryTab
          summary={summary}
          onViewAllMatches={() => setActiveTab('matches')}
          onViewAllGroups={() => setActiveTab('groups')}
        />
      )}

      {activeTab === 'matches' && <ProfileMatchesTab userId={userId} />}
      {activeTab === 'groups' && <ProfileGroupsTab userId={userId} />}
      {activeTab === 'stats' && <ProfileStatsTab />}
    </div>
  );
}
