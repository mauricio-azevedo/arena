'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GroupMember, Match } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';
import { MatchesList } from '@/features/matches/components/matches-list';
import { getMyGroups } from '@/features/groups/groups.api';
import { getAccessToken } from '@/lib/auth';
import { UserNameLink } from '@/features/users/components/user-name-link';

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
      <div className="grid grid-cols-3 rounded-[1.65rem] border bg-card/70 p-1.5 shadow-sm backdrop-blur-sm text-sm font-semibold">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setTab(tab.value)}
            className={`rounded-[1.25rem] px-3 py-2.5 transition-all ${
              activeTab === tab.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
        <CardContent className="p-4 text-sm leading-6 text-muted-foreground">
          Nenhum jogador no ranking ainda.
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-3">
      {ranking.map((member, index) => (
        <Card key={member.id}>
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-sm font-bold text-primary">
                {index + 1}
              </span>

              <div className="min-w-0">
                <p className="truncate font-semibold tracking-[-0.01em]">
                  <UserNameLink userId={member.userId}>{member.displayName}</UserNameLink>
                </p>
                <p className="text-xs text-muted-foreground">
                  {member.role === 'ADMIN' ? 'Admin' : 'Membro'}
                </p>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-xl font-semibold tracking-[-0.03em]">{member.rating.toFixed(0)}</p>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">rating</p>
            </div>
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
        <CardContent className="p-4 text-sm leading-6 text-muted-foreground">
          Nenhum membro no grupo ainda.
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-3">
      {members.map((member) => (
        <Card key={member.id}>
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="truncate font-semibold tracking-[-0.01em]">
                <UserNameLink userId={member.userId}>{member.displayName}</UserNameLink>
              </p>
              <p className="text-xs text-muted-foreground">
                {member.role === 'ADMIN' ? 'Admin' : 'Membro'}
              </p>
            </div>

            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              {member.rating.toFixed(0)}
            </span>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
