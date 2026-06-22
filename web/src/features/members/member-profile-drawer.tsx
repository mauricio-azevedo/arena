'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { Label, Meta } from '@/components/ui/text';
import { avatarBgClass, nameInitial } from '@/lib/avatar';
import { cn } from '@/lib/utils';
import { getAccessToken, getCurrentUserIdFromAccessToken } from '@/lib/auth';
import { ProfileMatchesList } from '@/features/profile/tabs/matches/sections/profile-matches-list';
import { getMemberProfile, unlinkMember } from './api/members.api';
import { StubClaimShare } from './components/stub-claim-share';
import type { MemberProfile } from './types/member-profile.type';

type MemberProfileDrawerProps = {
  open: boolean;
  groupId: string;
  // `key` bumps on every open so the content remounts and refetches.
  target: { memberId: string; key: number } | null;
  // Position from the live ranking (index-based); falls back to the stored rank.
  rank?: number;
  isAdmin: boolean;
  onClose: () => void;
  // Called after an action that changes the roster (e.g. admin unlink) so the
  // group can refetch.
  onChanged: () => void;
};

export function MemberProfileDrawer({
  open,
  groupId,
  target,
  rank,
  isAdmin,
  onClose,
  onChanged,
}: MemberProfileDrawerProps) {
  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DrawerContent aria-describedby={undefined}>
        {target && (
          <MemberProfileContent
            key={target.key}
            groupId={groupId}
            memberId={target.memberId}
            rank={rank}
            isAdmin={isAdmin}
            onClose={onClose}
            onChanged={onChanged}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}

type ContentProps = {
  groupId: string;
  memberId: string;
  rank?: number;
  isAdmin: boolean;
  onClose: () => void;
  onChanged: () => void;
};

function MemberProfileContent({
  groupId,
  memberId,
  rank,
  isAdmin,
  onClose,
  onChanged,
}: ContentProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [profile, setProfile] = useState<MemberProfile | null>(null);

  useEffect(() => {
    // The content remounts per member (keyed), so initial state is already
    // loading/null — just fetch.
    let isCurrent = true;

    getMemberProfile(groupId, memberId)
      .then((data) => {
        if (!isCurrent) return;
        setProfile(data);
        setStatus('ready');
      })
      .catch(() => {
        if (!isCurrent) return;
        setStatus('error');
      });

    return () => {
      isCurrent = false;
    };
  }, [groupId, memberId]);

  if (status === 'error') {
    return (
      <FallbackShell>
        <Meta className="mt-7 block text-center text-faint-foreground">
          Não foi possível carregar este perfil.
        </Meta>
      </FallbackShell>
    );
  }

  if (status !== 'ready' || !profile) {
    return (
      <FallbackShell>
        <div className="flex items-center gap-3.5">
          <div className="size-14 shrink-0 animate-pulse rounded-[1.45rem] bg-surface" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-32 animate-pulse rounded-full bg-surface" />
            <div className="h-3 w-20 animate-pulse rounded-full bg-surface" />
          </div>
        </div>
      </FallbackShell>
    );
  }

  const displayRank = rank ?? profile.currentRank ?? undefined;
  const profileHref = resolveProfileHref(profile.userId);
  const canUnlink =
    isAdmin &&
    profile.userId !== null &&
    profile.userId !== getCurrentUserIdFromAccessToken();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-5 pt-3">
        <div className="flex items-center gap-3.5">
          <span
            className={cn(
              'flex size-14 shrink-0 items-center justify-center rounded-[1.45rem] text-lg font-semibold text-foreground shadow-[inset_0_0_0_1px_var(--border)]',
              avatarBgClass(profile.groupMemberId),
            )}
            aria-hidden
          >
            {nameInitial(profile.displayName)}
          </span>

          <div className="min-w-0 flex-1">
            <DrawerTitle className="truncate text-left">{profile.displayName}</DrawerTitle>
            <Meta className="text-muted-foreground">
              {displayRank !== undefined ? `#${displayRank} · ` : ''}
              {Math.round(profile.rating)} pts
            </Meta>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Metric value={profile.stats.matchesPlayed} label="partidas" />
          <Metric value={profile.stats.wins} label="vitórias" />
          <Metric value={`${profile.stats.winRate}%`} label="aprov." />
        </div>

        {profileHref && (
          <Link
            href={profileHref}
            className="mt-3 flex h-11 items-center justify-center rounded-pill bg-surface text-brand shadow-hairline transition-opacity active:opacity-60"
          >
            <Label className="text-brand">Ver perfil completo</Label>
          </Link>
        )}

        {profile.userId === null ? (
          <StubClaimShare groupId={groupId} memberId={profile.groupMemberId} />
        ) : canUnlink ? (
          <AdminUnlinkButton
            groupId={groupId}
            memberId={profile.groupMemberId}
            onUnlinked={() => {
              onChanged();
              onClose();
            }}
          />
        ) : null}
      </div>

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto px-4 pb-8 [scrollbar-width:none]">
        <ProfileMatchesList matches={profile.matches} />
      </div>
    </div>
  );
}

// Shared frame for the loading and error states (keeps a DrawerTitle mounted for
// accessibility while the profile resolves).
function FallbackShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DrawerTitle className="sr-only">Perfil do jogador</DrawerTitle>
      <div className="px-5 pt-3">{children}</div>
    </div>
  );
}

// Admin-only: reverts a claim, turning the member back into a stub.
function AdminUnlinkButton({
  groupId,
  memberId,
  onUnlinked,
}: {
  groupId: string;
  memberId: string;
  onUnlinked: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function unlink() {
    const token = getAccessToken();
    if (!token) return;

    setWorking(true);
    setError(null);

    try {
      await unlinkMember(token, groupId, memberId);
      onUnlinked();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Não foi possível desvincular. Tente novamente.',
      );
      setWorking(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="mt-3 flex h-11 w-full items-center justify-center rounded-pill bg-surface text-tag-warn shadow-hairline transition-opacity active:opacity-60"
      >
        <Label className="text-tag-warn">Desvincular conta</Label>
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-3xl bg-surface px-4 py-3 shadow-hairline">
      <Meta className="block text-center text-muted-foreground">
        Desvincular a conta? O jogador volta a ser um perfil sem conta (o histórico é
        mantido).
      </Meta>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={working}
          className="flex h-10 items-center justify-center rounded-pill bg-background text-foreground shadow-hairline transition-opacity active:opacity-60"
        >
          <Label>Cancelar</Label>
        </button>
        <button
          type="button"
          onClick={unlink}
          disabled={working}
          className="flex h-10 items-center justify-center rounded-pill bg-tag-warn text-background transition-opacity active:opacity-60 disabled:opacity-60"
        >
          <Label className="text-background">{working ? 'Desvinculando…' : 'Desvincular'}</Label>
        </button>
      </div>
      {error && <Meta className="mt-2 block text-center text-tag-warn">{error}</Meta>}
    </div>
  );
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="min-w-0 rounded-[1.2rem] bg-surface px-3 py-2 text-center shadow-hairline">
      <p className="truncate text-lg font-semibold leading-none tracking-[-0.05em] text-foreground">
        {value}
      </p>
      <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

// Real members link to their cross-group profile; stub players (userId null) have
// none, so the caller hides the link entirely.
function resolveProfileHref(userId: string | null): string | null {
  if (!userId) {
    return null;
  }

  return userId === getCurrentUserIdFromAccessToken() ? '/profile' : `/users/${userId}`;
}
