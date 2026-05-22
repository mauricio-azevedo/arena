'use client';

import { useEffect, useState } from 'react';
import { BackButton } from '@/components/back-button';
import { GroupDetailTabs } from '@/features/groups/components/group-detail-tabs';
import { PageHeader } from '@/components/page-header';
import { GroupActions } from '@/features/groups/components/group-actions';
import {
  getGroup,
  getGroupMembers,
  getGroupRanking,
  getMyGroups,
} from '@/features/groups/api/groups.api';
import { getGroupMatches } from '@/features/matches/api/matches.api';
import { getAccessToken } from '@/lib/auth';
import { getDestinationLabel, getSafeInternalHref } from '@/lib/route-labels';
import type { Group, GroupMember, Match, MyGroup } from '@/types/api';
import { GroupDetailLoadingState } from '@/features/groups/components/group-detail-loading-state';
import { Card, CardContent } from '@/components/ui/card';

type Props = {
  groupId: string;
  tab?: string;
  returnTo?: string;
};

type GroupDetailData = {
  group: Group;
  ranking: GroupMember[];
  members: GroupMember[];
  matches: Match[];
  membership: MyGroup | null;
};

export function GroupDetail({ groupId, tab, returnTo }: Props) {
  const activeTab = tab === 'matches' || tab === 'members' || tab === 'ranking' ? tab : 'ranking';
  const [data, setData] = useState<GroupDetailData | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const backHref = getSafeInternalHref(returnTo, '/groups');
  const backLabel = getDestinationLabel(backHref);

  useEffect(() => {
    let isCurrent = true;

    async function loadGroupDetail() {
      setStatus('loading');
      setData(null);

      try {
        const token = getAccessToken();
        const membershipPromise = token
          ? getMyGroups(token).then((memberships) =>
              memberships.find((membership) => membership.groupId === groupId) ?? null,
            )
          : Promise.resolve(null);

        const [group, ranking, members, matches, membership] = await Promise.all([
          getGroup(groupId),
          getGroupRanking(groupId),
          getGroupMembers(groupId),
          getGroupMatches(groupId),
          membershipPromise,
        ]);

        if (!isCurrent) {
          return;
        }

        setData({ group, ranking, members, matches, membership });
        setStatus('ready');
      } catch {
        if (!isCurrent) {
          return;
        }

        setStatus('error');
      }
    }

    loadGroupDetail();

    return () => {
      isCurrent = false;
    };
  }, [groupId]);

  if (status === 'loading') {
    return <GroupDetailLoadingState />;
  }

  if (status === 'error' || !data) {
    return <GroupDetailErrorState backHref={backHref} backLabel={backLabel} />;
  }

  const isAdmin = data.membership?.role === 'ADMIN';
  const canManageMatches = Boolean(data.membership);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <BackButton href={backHref} label={backLabel} preferHref={Boolean(returnTo)} />

        <PageHeader
          title={data.group.name}
          description={data.group.description ?? 'Grupo público do BeachRank.'}
        />

        <GroupActions groupId={data.group.id} isAdmin={isAdmin} />
      </div>

      <GroupDetailTabs
        groupId={data.group.id}
        activeTab={activeTab}
        ranking={data.ranking}
        members={data.members}
        matches={data.matches}
        canManageMatches={canManageMatches}
      />
    </div>
  );
}

function GroupDetailErrorState({ backHref, backLabel }: { backHref: string; backLabel: string }) {
  return (
    <div className="space-y-6">
      <BackButton href={backHref} label={backLabel} preferHref />

      <Card>
        <CardContent className="space-y-2 p-4">
          <p className="text-sm font-semibold">Não foi possível carregar o grupo</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Verifique sua conexão e tente abrir o grupo novamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
