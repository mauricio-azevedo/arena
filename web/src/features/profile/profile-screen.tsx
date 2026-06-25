'use client';

import { useEffect, useState } from 'react';
import { Meta } from '@/components/ui/text';
import { getAccessToken } from '@/lib/auth';
import { APP_VERSION } from '@/lib/app-version';
import { getProfileSummary } from './api/profile.api';
import { getPublicProfileSummary } from './api/profile-user.api';
import { ProfileErrorState } from './components/profile-error-state';
import { ProfileLoadingState } from './components/profile-loading-state';
import { ProfileSignedOutState } from './components/profile-signed-out-state';
import { ProfileBestPartner } from './sections/profile-best-partner';
import { ProfileGroupsRail } from './sections/profile-groups-rail';
import { ProfileIdentity } from './sections/profile-identity';
import { ProfilePartnersSection } from './sections/profile-partners-section';
import { type EditedUser, SettingsDrawer } from './settings/settings-drawer';
import { ProfilePerformance } from './sections/profile-performance';
import type { ProfileSummary } from './types/profile-summary.type';

type Status = 'loading' | 'signed-out' | 'ready' | 'error';

type Props = {
  // Absent → the signed-in user's own profile; present → another player's.
  userId?: string;
  // Settings sheet lives here (it needs the loaded user), but the gear that opens it
  // sits in the page header — so its open-state is lifted to the page. Own profile only.
  settingsOpen?: boolean;
  onSettingsOpenChange?: (open: boolean) => void;
  // Reported once the profile has loaded (not while the skeleton shows), so the page
  // reveals the settings gear together with the content rather than over the skeleton.
  onSignedInChange?: (signedIn: boolean) => void;
};

export function ProfileScreen({
  userId,
  settingsOpen = false,
  onSettingsOpenChange,
  onSignedInChange,
}: Props) {
  const isOwn = !userId;

  const [status, setStatus] = useState<Status>('loading');
  const [summary, setSummary] = useState<ProfileSummary | null>(null);

  function applyEdit(edited: EditedUser) {
    setSummary((prev) => (prev ? { ...prev, user: { ...prev.user, ...edited } } : prev));
  }

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      setStatus('loading');
      // Keep the gear hidden while (re)loading — it should reveal with the content.
      onSignedInChange?.(false);

      const token = getAccessToken();

      if (!userId && !token) {
        setStatus('signed-out');
        return;
      }

      try {
        const data = userId
          ? await getPublicProfileSummary(userId)
          : await getProfileSummary(token as string);

        if (!isCurrent) return;
        setSummary(data);
        setStatus('ready');
        // Reveal the gear now, together with the loaded content.
        onSignedInChange?.(true);
      } catch {
        if (isCurrent) setStatus('error');
      }
    }

    load();

    return () => {
      isCurrent = false;
    };
  }, [userId, onSignedInChange]);

  if (status === 'loading') {
    return <ProfileLoadingState />;
  }

  if (status === 'signed-out') {
    return <ProfileSignedOutState />;
  }

  if (status === 'error' || !summary) {
    return (
      <ProfileErrorState
        error={
          isOwn
            ? 'Não foi possível carregar seu perfil agora.'
            : 'Não foi possível carregar este perfil agora.'
        }
      />
    );
  }

  // Default the list fields so an older/partial summary can't crash the screen.
  const { user, stats, bestPartner } = summary;
  const partners = summary.partners ?? [];
  const partnerCount = summary.partnerCount ?? partners.length;
  const recentGroups = summary.recentGroups ?? [];
  const ownerLabel = isOwn ? 'Você' : user.firstName;

  return (
    <div className="space-y-section">
      <ProfileIdentity
        userId={user.id}
        firstName={user.firstName}
        lastName={user.lastName}
        nickname={user.nickname}
        avatarColor={user.avatarColor}
        memberSince={user.memberSince}
      />

      <ProfilePerformance stats={stats} />

      {bestPartner && (
        <ProfileBestPartner
          partner={bestPartner}
          ownerLabel={ownerLabel}
          ownerUserId={user.id}
          ownerName={`${user.firstName} ${user.lastName}`}
          ownerAvatarColor={user.avatarColor}
        />
      )}

      <ProfilePartnersSection partners={partners} partnerCount={partnerCount} />

      <ProfileGroupsRail groups={recentGroups} />

      {isOwn && (
        <Meta className="block pt-2 text-center text-faint-foreground">
          Arena · versão {APP_VERSION}
        </Meta>
      )}

      {isOwn && (
        <SettingsDrawer
          open={settingsOpen}
          onOpenChange={onSettingsOpenChange ?? (() => {})}
          token={getAccessToken() ?? ''}
          user={user}
          onSaved={applyEdit}
        />
      )}
    </div>
  );
}
