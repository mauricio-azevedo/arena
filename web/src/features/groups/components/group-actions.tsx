'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getMyGroups } from '@/features/groups/groups.api';
import { getAccessToken } from '@/lib/auth';

type Props = {
  groupId: string;
};

export function GroupActions({ groupId }: Props) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      return;
    }

    async function checkAdmin(userToken: string) {
      try {
        const memberships = await getMyGroups(userToken);
        const membership = memberships.find((item) => item.groupId === groupId);

        setIsAdmin(membership?.role === 'ADMIN');
      } catch {
        setIsAdmin(false);
      }
    }

    checkAdmin(token);
  }, [groupId]);

  return (
    <div className={isAdmin ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-1 gap-2'}>
      <Button asChild>
        <Link href={`/groups/${groupId}/matches/new`}>Nova partida</Link>
      </Button>

      {isAdmin && (
        <Button asChild variant="outline">
          <Link href={`/groups/${groupId}/invite`}>Convidar</Link>
        </Button>
      )}
    </div>
  );
}
