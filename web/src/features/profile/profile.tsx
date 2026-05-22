'use client';

import { useEffect, useState } from 'react';
import { MoreHorizontal, Pencil } from 'lucide-react';
import { LogoutButton } from '@/features/auth/components/logout-button';
import { getAccessToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getProfileSummary } from './api/profile.api';
import { getPublicProfileSummary } from './api/profile-user.api';
import type { ProfileSummary } from './tabs/summary/types/profile-summary.type';
import { ProfileEditCard } from './components/profile-edit-card';
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
import type { ProfileUser } from './types/profile-user.type';

type Props = {
  userId?: string;
};

export function Profile({ userId }: Props) {
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('summary');
  const [isLoading, setIsLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [error, setError] = useState('');

  const isPublicProfile = Boolean(userId);

  useEffect(() => {
    const token = getAccessToken();
    setAccessToken(token);
    setIsEditingProfile(false);

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

  function handleProfileSaved(user: ProfileUser) {
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
      <div className="relative">
        <ProfileHeader user={summary.user} isPublicProfile={isPublicProfile} />

        {!isPublicProfile && (
          <div className="absolute right-4 top-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="border border-white/15 bg-white/12 text-primary-foreground shadow-sm backdrop-blur-sm hover:bg-white/20 hover:text-primary-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Abrir opções do perfil</span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Conta</DropdownMenuLabel>
                <DropdownMenuItem
                  onSelect={() => setIsEditingProfile((isEditing) => !isEditing)}
                >
                  <Pencil className="h-4 w-4" />
                  {isEditingProfile ? 'Fechar edição' : 'Editar perfil'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <LogoutButton className="w-full justify-start border-0 bg-transparent px-2 text-destructive shadow-none hover:bg-destructive/10 hover:text-destructive" />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {!isPublicProfile && isEditingProfile && accessToken && (
        <ProfileEditCard
          token={accessToken}
          user={summary.user}
          onCancel={() => setIsEditingProfile(false)}
          onSaved={handleProfileSaved}
          onTokenRefreshed={setAccessToken}
        />
      )}

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
