'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { GroupMember, Match, RankingMovement } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';
import { MatchesList } from '@/features/matches/components/matches-list';
import { UserNameLink } from '@/features/users/components/user-name-link';

type GroupTab = 'ranking' | 'matches' | 'members';

type Props = {
  groupId: string;
  activeTab: GroupTab;
  ranking: GroupMember[];
  members: GroupMember[];
  matches: Match[];
  canManageMatches: boolean;
};

const tabs: { value: GroupTab; label: string }[] = [
  { value: 'ranking', label: 'Ranking' },
  { value: 'matches', label: 'Partidas' },
  { value: 'members', label: 'Membros' },
];

export function GroupDetailTabs({
  groupId,
  activeTab,
  ranking,
  members,
  matches,
  canManageMatches,
}: Props) {
  const [selectedTab, setSelectedTab] = useState<GroupTab>(activeTab);

  useEffect(() => {
    setSelectedTab(activeTab);
  }, [activeTab]);

  function setTab(tab: GroupTab) {
    setSelectedTab(tab);

    if (typeof window === 'undefined') {
      return;
    }

    const nextUrl = tab === 'ranking' ? `/groups/${groupId}` : `/groups/${groupId}?tab=${tab}`;
    window.history.replaceState(null, '', nextUrl);
  }

  return (
    <div className="space-y-5">
      <div className="br-liquid-glass br-hairline grid grid-cols-3 rounded-[1.85rem] p-1.5 text-sm font-semibold">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setTab(tab.value)}
            aria-current={selectedTab === tab.value ? 'page' : undefined}
            className={`br-pressable rounded-[1.45rem] px-3 py-2.5 transition-all ${
              selectedTab === tab.value
                ? 'bg-foreground text-background shadow-[0_12px_28px_color-mix(in_oklch,var(--foreground)_18%,transparent)]'
                : 'text-muted-foreground hover:bg-white/45 hover:text-foreground dark:hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {selectedTab === 'ranking' && <RankingTab ranking={ranking} />}
      {selectedTab === 'matches' && (
        <MatchesTab matches={matches} groupId={groupId} canManage={canManageMatches} />
      )}
      {selectedTab === 'members' && <MembersTab members={members} />}
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
        <Card
          key={member.id}
          className={index === 0 ? 'bg-gradient-to-br from-card via-card to-accent/30' : undefined}
        >
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.35rem] text-sm font-bold ${
                  index === 0
                    ? 'bg-foreground text-background shadow-[0_12px_28px_color-mix(in_oklch,var(--foreground)_20%,transparent)]'
                    : 'bg-white/45 text-primary backdrop-blur-xl dark:bg-white/10'
                }`}
              >
                {index + 1}
              </span>

              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="min-w-0 truncate font-semibold tracking-[-0.015em]">
                    <UserNameLink userId={member.userId}>{getMemberDisplayName(member)}</UserNameLink>
                  </p>
                  <RankingMovementBadge movement={member.rankingMovement} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {member.role === 'ADMIN' ? 'Admin' : 'Membro'}
                </p>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-2xl font-semibold tracking-[-0.055em]">{member.rating.toFixed(0)}</p>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">rating</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function RankingMovementBadge({ movement }: { movement?: RankingMovement | null }) {
  if (!movement) {
    return null;
  }

  const isUp = movement.direction === 'UP';
  const Icon = isUp ? ArrowUp : ArrowDown;
  const verb = isUp ? 'Subiu' : 'Caiu';
  const label = `${verb} ${movement.positions} ${movement.positions === 1 ? 'posição' : 'posições'} no ranking`;
  const className = isUp
    ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'
    : 'bg-rose-500/12 text-rose-700 dark:text-rose-300';

  return (
    <span
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold leading-none ${className}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {movement.positions}
    </span>
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
              <p className="truncate font-semibold tracking-[-0.015em]">
                <UserNameLink userId={member.userId}>{getMemberDisplayName(member)}</UserNameLink>
              </p>
              <p className="text-xs text-muted-foreground">
                {member.role === 'ADMIN' ? 'Admin' : 'Membro'}
              </p>
            </div>

            <span className="rounded-full bg-white/45 px-3 py-1 text-xs font-semibold text-muted-foreground backdrop-blur-xl dark:bg-white/10">
              {member.rating.toFixed(0)}
            </span>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function getMemberDisplayName(member: GroupMember) {
  if (!member.user) {
    return 'Jogador';
  }

  return `${member.user.firstName} ${member.user.lastName}`.trim();
}
