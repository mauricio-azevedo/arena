'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { ClaimResult } from '@arena/contracts/claims';
import type { PublicInvite } from '@arena/contracts/invites';
import { getAccessToken } from '@/lib/auth';
import { resolveMemberName } from '@/lib/member-name';
import { buildAuthPath } from '@/features/auth/auth-navigation';
import { ClaimConflict } from '@/features/claim-offers/components/claim-conflict';
import { acceptInvite, claimInviteGuest } from '@/features/invites/api/invites.api';
import { InviteWelcome } from './invite-welcome';
import { InviteOpenRoster } from './invite-open-roster';
import { InviteClosedRecognition } from './invite-closed-recognition';

type Blocked = Extract<ClaimResult, { outcome: 'BLOCKED' }>;
type Screen = 'welcome' | 'roster' | 'recognition';

// Orchestrates the invite landing: welcome → (open roster | closed recognition) → the
// commit (take over a guest, or join as new). The commit needs an account, so a signed-out
// visitor is sent to the auth screen carrying where to return and what to resume; on the
// way back the `?take`/`?join` param replays the commit automatically. Outcomes: a claim
// lands in the group, a shared-match block shows the conflict screen.
export function InviteClient({ invite }: { invite: PublicInvite }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // One of the two is always set: the invite is addressed to a guest, or it is
  // the group's link and carries the roster.
  const closed = invite.kind === 'CLOSED' ? invite : null;
  const open = invite.kind === 'OPEN' ? invite : null;
  const [screen, setScreen] = useState<Screen>('welcome');
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState<Blocked | null>(null);
  const [error, setError] = useState('');

  const groupName = invite.group.name;
  // Their nickname is the whole name when they set one, as everywhere else.
  const inviterName = resolveMemberName({ user: invite.createdBy }).firstName;

  function goToGroup() {
    router.push(`/groups/${invite.groupId}`);
    router.refresh();
  }

  async function doClaim(authToken: string, guestId: string) {
    setBusy(true);
    setError('');
    try {
      const result = await claimInviteGuest(authToken, invite.token, guestId);
      if (result.outcome === 'CLAIMED') {
        goToGroup();
      } else {
        setBlocked(result);
      }
    } catch {
      setError('Não foi possível assumir agora. Tente novamente.');
      setBusy(false);
    }
  }

  async function doJoin(authToken: string) {
    setBusy(true);
    setError('');
    try {
      await acceptInvite(authToken, invite.token);
      goToGroup();
    } catch {
      setError('Não foi possível entrar no grupo. Tente novamente.');
      setBusy(false);
    }
  }

  // The commit needs an account: run it now if signed in, otherwise hand off to auth with
  // the return + resume intent and the invite context (banner + apelido).
  function startClaim(guestId: string, guestName: string) {
    const authToken = getAccessToken();
    if (authToken) {
      void doClaim(authToken, guestId);
      return;
    }
    router.push(
      buildAuthPath({
        mode: 'login',
        redirect: `/invites/${invite.token}?take=${guestId}`,
        context: `${guestName} · ${groupName}`,
        nickname: guestName,
      }),
    );
  }

  function startJoin() {
    const authToken = getAccessToken();
    if (authToken) {
      void doJoin(authToken);
      return;
    }
    router.push(
      buildAuthPath({
        mode: 'signup',
        redirect: `/invites/${invite.token}?join=1`,
        context: groupName,
      }),
    );
  }

  // Replay the pending commit once, when returning from auth already signed in.
  const resumed = useRef(false);
  useEffect(() => {
    if (resumed.current) return;
    const authToken = getAccessToken();
    if (!authToken) return;
    const take = searchParams.get('take');
    const join = searchParams.get('join');
    if (!take && !join) return;
    resumed.current = true;
    // Defer past the effect tick so the commit's first setState isn't a synchronous
    // cascade; the pending claim/join replays exactly once, on return from auth.
    queueMicrotask(() => {
      if (take) void doClaim(authToken, take);
      else void doJoin(authToken);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  if (blocked) {
    return (
      <ClaimConflict
        groupId={invite.groupId}
        groupName={groupName}
        stubName={blocked.stubName}
        sharedMatches={blocked.sharedMatches}
        admins={blocked.admins}
      />
    );
  }

  // Resuming a commit after auth: hold on a spinner until it lands or blocks.
  if (busy && screen === 'welcome' && !error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Carregando" />
      </div>
    );
  }

  if (screen === 'recognition' && closed) {
    return (
      <InviteClosedRecognition
        groupName={groupName}
        inviterName={inviterName}
        target={closed.target}
        busy={busy}
        error={error}
        onConfirm={() => startClaim(closed.target.groupMemberId, closed.target.displayName)}
      />
    );
  }

  if (screen === 'roster' && open) {
    return (
      <InviteOpenRoster
        groupName={groupName}
        guests={open.guests}
        targetUnavailable={open.targetUnavailable}
        busy={busy}
        error={error}
        onClaim={startClaim}
        onJoinNew={startJoin}
      />
    );
  }

  return (
    <InviteWelcome
      groupName={groupName}
      inviterName={inviterName}
      onContinue={() => setScreen(closed ? 'recognition' : 'roster')}
    />
  );
}
