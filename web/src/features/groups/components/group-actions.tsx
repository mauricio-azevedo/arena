'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getMyGroups } from '@/features/groups/api/groups.api';
import { getAccessToken } from '@/lib/auth';

type Props = {
  groupId: string;
};

type AdminState = 'checking' | 'admin' | 'member';

export function GroupActions({ groupId }: Props) {
  const [adminState, setAdminState] = useState<AdminState>('checking');

  useEffect(() => {
    let isCurrent = true;
    const token = getAccessToken();

    if (!token) {
      setAdminState('member');
      return;
    }

    async function checkAdmin(userToken: string) {
      try {
        const memberships = await getMyGroups(userToken);
        const membership = memberships.find((item) => item.groupId === groupId);

        if (!isCurrent) {
          return;
        }

        setAdminState(membership?.role === 'ADMIN' ? 'admin' : 'member');
      } catch {
        if (!isCurrent) {
          return;
        }

        setAdminState('member');
      }
    }

    checkAdmin(token);

    return () => {
      isCurrent = false;
    };
  }, [groupId]);

  if (adminState === 'checking') {
    return <GroupActionsCheckingState groupId={groupId} />;
  }

  const isAdmin = adminState === 'admin';

  return (
    <div className={isAdmin ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-1 gap-2'}>
      <Button asChild size="lg">
        <Link href={`/groups/${groupId}/matches/new`}>Nova partida</Link>
      </Button>

      {isAdmin && (
        <Button asChild variant="outline" size="lg">
          <Link href={`/groups/${groupId}/invite`}>Convidar</Link>
        </Button>
      )}
    </div>
  );
}

function GroupActionsCheckingState({ groupId }: { groupId: string }) {
  return (
    <div className="grid grid-cols-2 gap-2" aria-busy="true">
      <Button asChild size="lg">
        <Link href={`/groups/${groupId}/matches/new`}>Nova partida</Link>
      </Button>

      <div className="h-11 animate-pulse rounded-2xl border bg-muted/65" aria-hidden="true" />
    </div>
  );
}
