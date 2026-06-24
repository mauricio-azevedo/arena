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
import { type EditedUser, ProfileEditDrawer } from './sections/profile-edit-drawer';
import { ProfileGroupsRail } from './sections/profile-groups-rail';
import { ProfileIdentity } from './sections/profile-identity';
import { ProfileLogoutRow } from './sections/profile-logout-row';
import { ProfilePartnersSection } from './sections/profile-partners-section';
import { ProfilePerformance } from './sections/profile-performance';
import type { ProfileSummary } from './types/profile-summary.type';

type Status = 'loading' | 'signed-out' | 'ready' | 'error';

type Props = {
  // Absent → the signed-in user's own profile; present → another player's.
  userId?: string;
};

export function ProfileScreen({ userId }: Props) {
  const isOwn = !userId;

  const [status, setStatus] = useState<Status>('loading');
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [editing, setEditing] = useState(false);

  function applyEdit(edited: EditedUser) {
    setSummary((prev) => (prev ? { ...prev, user: { ...prev.user, ...edited } } : prev));
  }

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      setStatus('loading');

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
      } catch {
        if (isCurrent) setStatus('error');
      }
    }

    load();

    return () => {
      isCurrent = false;
    };
  }, [userId]);

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
    <div className="space-y-6">
      <ProfileIdentity
        userId={user.id}
        firstName={user.firstName}
        lastName={user.lastName}
        nickname={user.nickname}
        avatarColor={user.avatarColor}
        memberSince={user.memberSince}
        onEdit={isOwn ? () => setEditing(true) : undefined}
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
        <div className="space-y-4 pt-2">
          <ProfileLogoutRow />
          <Meta className="block text-center text-faint-foreground">
            Arena · versão {APP_VERSION}
          </Meta>
        </div>
      )}

      {isOwn && (
        <ProfileEditDrawer
          open={editing}
          onOpenChange={setEditing}
          token={getAccessToken() ?? ''}
          user={user}
          onSaved={applyEdit}
        />
      )}
    </div>
  );
}
