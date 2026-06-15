'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, Crown } from 'lucide-react';
import type { GroupMember, Match, RankingMovement } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';
import { MatchesList } from '@/features/matches/components/matches-list';
import { UserNameLink } from '@/features/users/components/user-name-link';

export type GroupTab = 'ranking' | 'matches' | 'members';

type Props = {
  groupId: string;
  activeTab: GroupTab;
  ranking: GroupMember[];
  members: GroupMember[];
  matches: Match[];
  canManageMatches: boolean;
  currentMembershipId: string | null;
};

export function GroupDetailTabs({
  groupId,
  activeTab,
  ranking,
  members,
  matches,
  canManageMatches,
  currentMembershipId,
}: Props) {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<GroupTab>(activeTab);
  const tabs = useMemo(
    () => [
      { value: 'ranking' as const, label: 'Ranking', count: ranking.length },
      { value: 'matches' as const, label: 'Partidas', count: matches.length },
      { value: 'members' as const, label: 'Membros', count: members.length },
    ],
    [matches.length, members.length, ranking.length],
  );

  useEffect(() => {
    setSelectedTab(activeTab);
  }, [activeTab]);

  function setTab(tab: GroupTab) {
    setSelectedTab(tab);
    const nextUrl = tab === 'ranking' ? `/groups/${groupId}` : `/groups/${groupId}?tab=${tab}`;
    router.replace(nextUrl, { scroll: false });
  }

  return (
    <div className="space-y-5">
      <div className="br-liquid-glass br-hairline grid grid-cols-3 rounded-[1.85rem] p-1.5 text-sm font-semibold">
        {tabs.map((tab) => {
          const isSelected = selectedTab === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setTab(tab.value)}
              aria-pressed={isSelected}
              className={`br-pressable flex min-h-12 flex-col items-center justify-center rounded-[1.45rem] px-2 transition-all sm:px-3 ${
                isSelected
                  ? 'bg-foreground text-background shadow-[0_12px_28px_color-mix(in_oklch,var(--foreground)_18%,transparent)]'
                  : 'text-muted-foreground hover:bg-white/45 hover:text-foreground dark:hover:bg-white/10'
              }`}
            >
              <span>{tab.label}</span>
              <span className={isSelected ? 'text-[11px] text-background/70' : 'text-[11px] text-muted-foreground/75'}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {selectedTab === 'ranking' && (
        <TabPanel>
          <RankingTab ranking={ranking} currentMembershipId={currentMembershipId} />
        </TabPanel>
      )}

      {selectedTab === 'matches' && (
        <TabPanel>
          <MatchesTab matches={matches} groupId={groupId} canManage={canManageMatches} />
        </TabPanel>
      )}

      {selectedTab === 'members' && (
        <TabPanel>
          <MembersTab members={members} currentMembershipId={currentMembershipId} />
        </TabPanel>
      )}
    </div>
  );
}

function TabPanel({ children }: { children: ReactNode }) {
  return <div className="outline-none">{children}</div>;
}

function RankingTab({
  ranking,
  currentMembershipId,
}: {
  ranking: GroupMember[];
  currentMembershipId: string | null;
}) {
  if (ranking.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-2 p-4">
          <p className="text-sm font-semibold">Nenhum jogador no ranking ainda</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Registre partidas para transformar os membros em uma disputa real.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-3" aria-label="Ranking do grupo">
      {ranking.map((member, index) => {
        const rank = index + 1;
        const isLeader = rank === 1;
        const isCurrent = member.id === currentMembershipId;

        return (
          <Card
            key={member.id}
            className={
              isCurrent
                ? 'bg-gradient-to-br from-card via-card to-primary/18 ring-2 ring-primary/35'
                : isLeader
                  ? 'bg-gradient-to-br from-card via-card to-accent/30'
                  : undefined
            }
          >
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <RankBadge rank={rank} isLeader={isLeader} isCurrent={isCurrent} />

                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="min-w-0 truncate font-semibold tracking-[-0.015em]">
                      <UserNameLink userId={member.userId}>{getMemberDisplayName(member)}</UserNameLink>
                    </p>

                    {isCurrent && <InlineBadge>Você</InlineBadge>}
                    {isLeader && <LeaderBadge />}
                    <RankingMovementBadge movement={member.rankingMovement} />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {getRankingDetail(member, rank)}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-2xl font-semibold tracking-[-0.055em]">{member.rating.toFixed(0)}</p>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">rating</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

function RankBadge({ rank, isLeader, isCurrent }: { rank: number; isLeader: boolean; isCurrent: boolean }) {
  const className = isLeader
    ? 'bg-foreground text-background shadow-[0_12px_28px_color-mix(in_oklch,var(--foreground)_20%,transparent)]'
    : isCurrent
      ? 'bg-primary text-primary-foreground shadow-[0_12px_28px_color-mix(in_oklch,var(--primary)_20%,transparent)]'
      : 'bg-white/45 text-primary backdrop-blur-xl dark:bg-white/10';

  return (
    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.35rem] text-sm font-bold ${className}`}>
      {rank}
    </span>
  );
}

function InlineBadge({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 rounded-full bg-primary/12 px-2 py-0.5 text-[11px] font-bold leading-none text-primary">
      {children}
    </span>
  );
}

function LeaderBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-500/14 px-2 py-0.5 text-[11px] font-bold leading-none text-amber-700 dark:text-amber-300">
      <Crown className="h-3 w-3" />
      Líder
    </span>
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
      emptyDescription="Registre a primeira partida para começar a movimentar o ranking."
    />
  );
}

function MembersTab({
  members,
  currentMembershipId,
}: {
  members: GroupMember[];
  currentMembershipId: string | null;
}) {
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
    <section className="space-y-3" aria-label="Membros do grupo">
      {members.map((member) => {
        const isCurrent = member.id === currentMembershipId;

        return (
          <Card key={member.id} className={isCurrent ? 'ring-2 ring-primary/30' : undefined}>
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="truncate font-semibold tracking-[-0.015em]">
                    <UserNameLink userId={member.userId}>{getMemberDisplayName(member)}</UserNameLink>
                  </p>
                  {isCurrent && <InlineBadge>Você</InlineBadge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {member.role === 'ADMIN' ? 'Admin do grupo' : 'Membro'}
                </p>
              </div>

              <span className="rounded-full bg-white/45 px-3 py-1 text-xs font-semibold text-muted-foreground backdrop-blur-xl dark:bg-white/10">
                {member.rating.toFixed(0)} rating
              </span>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

function getRankingDetail(member: GroupMember, rank: number) {
  if (rank === 1) {
    return member.role === 'ADMIN' ? 'Líder do ranking · Admin' : 'Líder do ranking';
  }

  return member.role === 'ADMIN' ? 'Disputando posição · Admin' : 'Disputando posição';
}

function getMemberDisplayName(member: GroupMember) {
  if (!member.user) {
    return 'Jogador';
  }

  return `${member.user.firstName} ${member.user.lastName}`.trim();
}
