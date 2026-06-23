'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight, Info, UserPlus } from 'lucide-react';
import { Drawer, DrawerNested, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { Label, Meta } from '@/components/ui/text';
import { avatarBgClass, nameInitial } from '@/lib/avatar';
import { cn } from '@/lib/utils';
import { getAccessToken, getCurrentUserIdFromAccessToken } from '@/lib/auth';
import { createMemberClaimLink, getMemberProfile } from './api/members.api';
import { StubClaimPanel } from './components/stub-claim-panel';
import type { MemberProfile } from './types/member-profile.type';

type MemberProfileDrawerProps = {
  open: boolean;
  groupId: string;
  groupName: string;
  totalMembers: number;
  // `key` bumps on every open so the content remounts and refetches.
  target: { memberId: string; key: number } | null;
  // Position from the live ranking (index-based); falls back to the stored rank.
  rank?: number;
  onClose: () => void;
};

export function MemberProfileDrawer({
  open,
  groupId,
  groupName,
  totalMembers,
  target,
  rank,
  onClose,
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
      <DrawerContent aria-describedby={undefined} size="fit">
        {target && (
          <MemberProfileContent
            key={target.key}
            groupId={groupId}
            groupName={groupName}
            totalMembers={totalMembers}
            memberId={target.memberId}
            rank={rank}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}

type ContentProps = {
  groupId: string;
  groupName: string;
  totalMembers: number;
  memberId: string;
  rank?: number;
};

function MemberProfileContent({
  groupId,
  groupName,
  totalMembers,
  memberId,
  rank,
}: ContentProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  // The claim flow opens as a nested drawer that slides up over the peek. The link
  // is minted on the first open and held here, so reopening reuses the same
  // single-use invite instead of generating a new one.
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimUrl, setClaimUrl] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  // Dedupes concurrent mints (double-tap, or reopening while one is in flight) so
  // we never burn more than one single-use invite per stub.
  const claimPending = useRef(false);

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
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="size-16 animate-pulse rounded-full bg-surface" />
          <div className="h-6 w-36 animate-pulse rounded-full bg-surface" />
          <div className="h-3 w-24 animate-pulse rounded-full bg-surface" />
        </div>
      </FallbackShell>
    );
  }

  const isStub = profile.userId === null;
  const currentUserId = getCurrentUserIdFromAccessToken();
  const isYou = profile.userId !== null && profile.userId === currentUserId;
  // Rank comes from the live ranking only (active members). A member not in it —
  // e.g. one who left — has no current standing, so we show no position line rather
  // than a stale stored rank against the active-member count (e.g. "#5 de 3").
  const positionLine = buildPositionLine(rank, totalMembers, groupName, isYou);
  const profileHref = resolveProfileHref(profile.userId, currentUserId);

  // Open the claim sheet and mint the link on first open (reused afterwards). An
  // earlier error is cleared so reopening retries; an in-flight mint is not repeated.
  function openClaim() {
    setClaimOpen(true);

    if (claimUrl || claimPending.current) {
      return;
    }

    const token = getAccessToken();

    if (!token) {
      setClaimError('Entre na sua conta para gerar o convite.');
      return;
    }

    claimPending.current = true;
    setClaimError(null);

    createMemberClaimLink(token, groupId, memberId)
      .then((invite) => setClaimUrl(`${window.location.origin}${invite.path}`))
      .catch(() => setClaimError('Não foi possível gerar o convite. Tente novamente.'))
      .finally(() => {
        claimPending.current = false;
      });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-4 pb-10 [scrollbar-width:none]">
      {/* identity */}
      <div className="flex flex-col items-center text-center">
        <span
          className={cn(
            'flex size-16 items-center justify-center rounded-full text-xl font-extrabold',
            isStub
              ? 'border border-dashed border-border-accent text-muted-foreground'
              : cn('text-foreground shadow-hairline', avatarBgClass(profile.groupMemberId)),
          )}
          aria-hidden
        >
          {nameInitial(profile.displayName)}
        </span>

        <div className="mt-3.5 flex max-w-full items-center justify-center gap-2">
          <DrawerTitle className="truncate text-[1.45rem] font-extrabold tracking-[-0.01em]">
            {profile.displayName}
          </DrawerTitle>
          {isStub && (
            <span className="shrink-0 rounded-lg bg-tag-warn/15 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-tag-warn">
              Sem conta
            </span>
          )}
        </div>

        {positionLine && (
          <Meta className="mt-2 font-bold text-brand">{positionLine}</Meta>
        )}
      </div>

      {/* stats */}
      <div className="mt-5 flex items-center rounded-[1.4rem] bg-surface px-1 py-4 shadow-hairline">
        <PeekStat value={Math.round(profile.rating)} label="Rating" />
        <StatDivider />
        <PeekStat value={`${profile.stats.winRate}%`} label="Aproveit." />
        <StatDivider />
        <PeekStat value={profile.stats.matchesPlayed} label="Partidas" />
      </div>

      {/* action */}
      {isStub ? (
        <>
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-tag-warn/[0.08] px-3.5 py-3 ring-1 ring-inset ring-tag-warn/20">
            <Info className="mt-px size-4 shrink-0 text-tag-warn" aria-hidden />
            <Meta className="text-left font-medium text-tag-warn/90">
              Jogador sem conta. Convide-o para assumir este perfil e levar todo o
              histórico para o app.
            </Meta>
          </div>
          <button
            type="button"
            onClick={openClaim}
            className="mt-3 flex h-12 items-center justify-center gap-2 rounded-pill bg-brand text-brand-foreground shadow-button transition-opacity active:opacity-90"
          >
            <UserPlus className="size-4.5 text-brand-foreground" aria-hidden />
            <Label className="text-brand-foreground">Convidar para assumir o perfil</Label>
          </button>

          <DrawerNested open={claimOpen} onOpenChange={setClaimOpen}>
            <DrawerContent aria-describedby={undefined} size="fit">
              <StubClaimPanel
                name={profile.displayName}
                url={claimUrl}
                error={claimError}
                onBack={() => setClaimOpen(false)}
              />
            </DrawerContent>
          </DrawerNested>
        </>
      ) : (
        profileHref && (
          <Link
            href={profileHref}
            className="mt-4 flex h-12 items-center justify-center gap-1.5 rounded-pill bg-brand text-brand-foreground shadow-button transition-opacity active:opacity-90"
          >
            <Label className="text-brand-foreground">Ver perfil completo</Label>
            <ChevronRight className="size-4.5 text-brand-foreground" aria-hidden />
          </Link>
        )
      )}
    </div>
  );
}

// Shared frame for the loading and error states (keeps a DrawerTitle mounted for
// accessibility while the profile resolves).
function FallbackShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DrawerTitle className="sr-only">Perfil do jogador</DrawerTitle>
      <div className="px-6 pt-4">{children}</div>
    </div>
  );
}

function PeekStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="min-w-0 flex-1 text-center">
      <p className="truncate text-[1.4rem] font-extrabold leading-none tracking-[-0.03em] tabular-nums text-foreground">
        {value}
      </p>
      <p className="mt-1.5 truncate text-[10px] font-bold uppercase tracking-wide text-faint-foreground">
        {label}
      </p>
    </div>
  );
}

function StatDivider() {
  return <div className="h-8 w-px shrink-0 bg-border-accent/50" aria-hidden />;
}

// Position relative to the group: "Você · #3 de 19" for yourself, otherwise
// "#3 de 19 · <group>". Returns null when the member isn't currently ranked, so
// the caller hides the line entirely (no misleading standing).
function buildPositionLine(
  rank: number | undefined,
  totalMembers: number,
  groupName: string,
  isYou: boolean,
): string | null {
  if (rank === undefined) {
    return null;
  }

  const position = `#${rank} de ${totalMembers}`;

  return isYou ? `Você · ${position}` : `${position} · ${groupName}`;
}

// Real members link to their cross-group profile; stub players (userId null) have
// none, so the caller hides the link entirely.
function resolveProfileHref(
  userId: string | null,
  currentUserId: string | null,
): string | null {
  if (!userId) {
    return null;
  }

  return userId === currentUserId ? '/profile' : `/users/${userId}`;
}
