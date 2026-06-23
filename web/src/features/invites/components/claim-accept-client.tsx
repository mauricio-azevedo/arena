'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { ClaimMembership, GroupInvite, SharedMatch, ClaimAdmin } from '@/types/api';
import { Body } from '@/components/ui/text';
import { acceptClaim } from '@/features/invites/api/invites.api';
import { getMyGroups } from '@/features/groups/api/groups.api';
import { getProfileSummary } from '@/features/profile/api/profile.api';
import { buildAuthHref } from '@/features/auth/helpers/auth-redirect.helper';
import { getAccessToken } from '@/lib/auth';
import { ClaimLanding, type ClaimMode } from './claim/claim-landing';
import { ClaimSuccess } from './claim/claim-success';
import { ClaimConflict } from './claim/claim-conflict';

type Props = {
  invite: GroupInvite;
};

type Blocked = { stubName: string; sharedMatches: SharedMatch[]; admins: ClaimAdmin[] };

// The claim flow (`/claim/<token>`): take over a stub player (jogador sem conta) and
// turn its history into your account. Three landings (logged out / in-out / in-group
// merge) and two outcomes (claimed / blocked because the two shared a match).
export function ClaimAcceptClient({ invite }: Props) {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<ClaimMode>('logged-out');
  const [meName, setMeName] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [claimed, setClaimed] = useState<ClaimMembership | null>(null);
  const [blocked, setBlocked] = useState<Blocked | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function resolveViewer() {
      const token = getAccessToken();

      if (!token) {
        if (isCurrent) {
          setMode('logged-out');
          setChecking(false);
        }
        return;
      }

      try {
        const [memberships, profile] = await Promise.all([
          getMyGroups(token),
          getProfileSummary(token),
        ]);
        if (!isCurrent) return;

        const isMember = memberships.some((item) => item.groupId === invite.groupId);
        setMode(isMember ? 'merge' : 'claim');
        setMeName(`${profile.user.firstName} ${profile.user.lastName}`.trim());
      } catch {
        // A failed lookup still lets them claim — treat as a non-member account.
        if (isCurrent) {
          setMode('claim');
        }
      } finally {
        if (isCurrent) {
          setChecking(false);
        }
      }
    }

    resolveViewer();

    return () => {
      isCurrent = false;
    };
  }, [invite.groupId]);

  async function handleAssume() {
    const token = getAccessToken();
    if (!token) return;

    setError('');
    setPending(true);

    try {
      const result = await acceptClaim(token, invite.token);

      if (result.outcome === 'CLAIMED') {
        setClaimed(result.membership);
      } else {
        setBlocked({
          stubName: result.stubName,
          sharedMatches: result.sharedMatches,
          admins: result.admins,
        });
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Não foi possível assumir o perfil. Tente novamente.',
      );
      setPending(false);
    }
  }

  const stub = invite.stub;
  const groupName = invite.group?.name ?? 'o grupo';

  // The claim page is only reached for CLAIM invites, which always carry a stub.
  if (!stub) {
    return (
      <Body className="py-10 text-center text-muted-foreground">
        Este convite não está mais disponível.
      </Body>
    );
  }

  if (claimed) {
    return <ClaimSuccess stub={stub} membership={claimed} groupName={groupName} />;
  }

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

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-faint-foreground">
        <Loader2 className="size-6 animate-spin" aria-hidden />
      </div>
    );
  }

  const claimPath = `/claim/${invite.token}`;

  return (
    <ClaimLanding
      groupName={groupName}
      stub={stub}
      mode={mode}
      meName={meName}
      pending={pending}
      error={error}
      loginHref={buildAuthHref('/login', claimPath)}
      registerHref={buildAuthHref('/register', claimPath)}
      onAssume={handleAssume}
      onReject={() => router.push('/')}
    />
  );
}
