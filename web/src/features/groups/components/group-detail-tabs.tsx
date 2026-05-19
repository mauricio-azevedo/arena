'use client';

import { useRouter } from 'next/navigation';
import type { GroupMember, Match } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';
import { MatchesList } from '@/features/matches/components/matches-list';
import { useEffect, useState } from 'react';
import { getMyGroups } from '@/features/groups/groups.api';
import { getAccessToken } from '@/lib/auth';

type GroupTab = 'ranking' | 'matches' | 'members';

type Props = {
  groupId: string;
  activeTab: GroupTab;
  ranking: GroupMember[];
  members: GroupMember[];
  matches: Match[];
};

const tabs: { value: GroupTab; label: string }[] = [
  { value: 'ranking', label: 'Ranking' },
  { value: 'matches', label: 'Partidas' },
  { value: 'members', label: 'Membros' },
];

getAccessToken();
export function GroupDetailTabs({ groupId, activeTab, ranking, members, matches }: Props) {
  const router = useRouter();

  const [canManageMatches, setCanManageMatches] = useState(false);

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      setCanManageMatches(false);
      return;
    }

    async function checkMembership(userToken: string) {
      try {
        const memberships = await getMyGroups(userToken);
        const membership = memberships.find((item) => item.groupId === groupId);

        setCanManageMatches(Boolean(membership));
      } catch {
        setCanManageMatches(false);
      }
    }

    checkMembership(token);
  }, [groupId]);

  function setTab(tab: GroupTab) {
    router.replace(`/groups/${groupId}?tab=${tab}`, {
      scroll: false,
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 rounded-xl border bg-muted/30 p-1 text-sm font-medium">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setTab(tab.value)}
            className={`rounded-lg px-3 py-2 ${
              activeTab === tab.value ? 'bg-background shadow-sm' : 'text-muted-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === 'ranking' && <RankingTab ranking={ranking} />}
      {activeTab === 'matches' && (
        <MatchesTab matches={matches} groupId={groupId} canManage={canManageMatches} />
      )}
      {activeTab === 'members' && <MembersTab members={members} />}
    </div>
  );
}

function RankingTab({ ranking }: { ranking: GroupMember[] }) {
  if (ranking.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          Nenhum jogador no ranking ainda.
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-3">
      {ranking.map((member, index) => (
        <Card key={member.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                {index + 1}
              </span>

              <div>
                <p className="font-medium">{member.displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {member.role === 'ADMIN' ? 'Admin' : 'Membro'}
                </p>
              </div>
            </div>

            <p className="text-lg font-semibold">{member.rating.toFixed(1)}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function MatchesTab({
  matches,
  groupId,
  canManage,
}: {
  matches: Match[];
  groupId: string;
  canManage: boolean;
}) {
  return (
    <MatchesList
      matches={matches}
      groupId={groupId}
      canManage={canManage}
      emptyTitle="Nenhuma partida registrada"
      emptyDescription="Quando o grupo registrar partidas, elas aparecem aqui."
    />
  );
}

function MembersTab({ members }: { members: GroupMember[] }) {
  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          Nenhum membro no grupo ainda.
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-3">
      {members.map((member) => (
        <Card key={member.id}>
          <CardContent className="p-4">
            <div>
              <p className="font-medium">{member.displayName}</p>
              <p className="text-xs text-muted-foreground">
                {member.role === 'ADMIN' ? 'Admin' : 'Membro'}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
