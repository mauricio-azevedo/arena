'use client';

import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/auth';
import { getProfileSummary } from './profile.api';
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
import { ProfileTab } from '@/features/profile/types/profile-tab.type';

export function Profile() {
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('summary');
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

    async function loadProfile(authToken: string) {
      try {
        setError('');
        const data = await getProfileSummary(authToken);
        setSummary(data);
      } catch {
        setError('Não foi possível carregar seu perfil agora.');
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile(token);
  }, []);

  if (isLoading) {
    return <ProfileLoadingState />;
  }

  if (!hasToken) {
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
      <ProfileHeader user={summary.user} />
      <ProfileTabs activeTab={activeTab} onChange={setActiveTab} />
      {activeTab === 'summary' && (
        <ProfileSummaryTab
          summary={summary}
          onViewAllMatches={() => setActiveTab('matches')}
          onViewAllGroups={() => setActiveTab('groups')}
        />
      )}

      {activeTab === 'matches' && <ProfileMatchesTab />}
      {activeTab === 'groups' && <ProfileGroupsTab />}
      {activeTab === 'stats' && <ProfileStatsTab />}
    </div>
  );
}
