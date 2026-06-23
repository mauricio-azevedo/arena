'use client';

import { useEffect, useState } from 'react';
import { GroupActions } from '@/features/groups/components/group-actions';
import { GroupDetailTabs } from '@/features/groups/components/group-detail-tabs';
import { GroupSummaryCard } from '@/features/groups/components/group-summary-card';
import {
  getGroup,
  getGroupMembers,
  getGroupRanking,
  getMyGroups,
} from '@/features/groups/api/groups.api';
import { getGroupMatches } from '@/features/matches/api/matches.api';
import { getAccessToken } from '@/lib/auth';
import type { Group, GroupMember, Match, MyGroup } from '@/types/api';
import { GroupDetailLoadingState } from '@/features/groups/components/group-detail-loading-state';
import { Card, CardContent } from '@/components/ui/card';
import { Body, Label } from '@/components/ui/text';
import { MatchDrawerProvider } from '@/features/matches/match-drawer/match-drawer-context';
import { MemberProfileDrawerProvider } from '@/features/members/member-profile-drawer-context';

const groupTabs = ['ranking', 'matches'] as const;
type GroupTab = (typeof groupTabs)[number];

type Props = {
  groupId: string;
  tab?: string;
  autoOpenCompose?: boolean;
};

type GroupDetailData = {
  group: Group;
  ranking: GroupMember[];
  members: GroupMember[];
  matches: Match[];
  membership: MyGroup | null;
};

export function GroupDetail({ groupId, tab, autoOpenCompose = false }: Props) {
  const activeTab: GroupTab = groupTabs.includes(tab as GroupTab) ? (tab as GroupTab) : 'ranking';
  const [data, setData] = useState<GroupDetailData | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function loadGroupDetail() {
      setStatus('loading');
      setData(null);

      try {
        const token = getAccessToken();
        const membershipPromise = token
          ? getMyGroups(token).then(
              (memberships) =>
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
  }, [groupId, refreshKey]);

  if (status === 'loading') {
    return <GroupDetailLoadingState />;
  }

  if (status === 'error' || !data) {
    return <GroupDetailErrorState />;
  }

  const canManageMatches = Boolean(data.membership);
  const currentMembershipId = data.membership?.id ?? null;

  return (
    <MatchDrawerProvider
      groupId={data.group.id}
      groupName={data.group.name}
      members={data.members}
      ranking={data.ranking}
      currentMembershipId={currentMembershipId}
      onSaved={() => setRefreshKey((key) => key + 1)}
      autoOpenCreate={autoOpenCompose && canManageMatches}
    >
      <MemberProfileDrawerProvider
        groupId={data.group.id}
        groupName={data.group.name}
        ranking={data.ranking}
      >
        <div className="space-y-8">
          <div className="space-y-3">
            <GroupSummaryCard
              group={data.group}
              ranking={data.ranking}
              members={data.members}
              matches={data.matches}
              membership={data.membership}
            />

            <GroupActions groupId={data.group.id} canManageMatches={canManageMatches} />
          </div>

          <GroupDetailTabs
            groupId={data.group.id}
            activeTab={activeTab}
            ranking={data.ranking}
            matches={data.matches}
            canManageMatches={canManageMatches}
            currentMembershipId={currentMembershipId}
          />
        </div>
      </MemberProfileDrawerProvider>
    </MatchDrawerProvider>
  );
}

function GroupDetailErrorState() {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <Label className="block text-foreground">Não foi possível carregar o grupo</Label>
        <Body className="text-muted-foreground">
          Verifique sua conexão e tente abrir o grupo novamente.
        </Body>
      </CardContent>
    </Card>
  );
}
