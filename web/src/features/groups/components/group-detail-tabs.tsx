'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, Crown } from 'lucide-react';
import type { GroupMember, Match, RankingMovement } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';
import { MatchesList } from '@/features/matches/components/matches-list';
import { UserNameLink } from '@/features/users/components/user-name-link';
import { cn } from '@/lib/utils';

export type GroupTab = 'ranking' | 'matches';

type Props = {
  groupId: string;
  activeTab: GroupTab;
  ranking: GroupMember[];
  matches: Match[];
  canManageMatches: boolean;
  currentMembershipId: string | null;
};

export function GroupDetailTabs({
  groupId,
  activeTab,
  ranking,
  matches,
  canManageMatches,
  currentMembershipId,
}: Props) {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<GroupTab>(activeTab);
  const tabs = useMemo(
    () => [
      { value: 'ranking' as const, label: 'Ranking' },
      { value: 'matches' as const, label: 'Partidas' },
    ],
    [],
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
      <div className="flex gap-7 border-b border-divider">
        {tabs.map((tab) => {
          const isSelected = selectedTab === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setTab(tab.value)}
              aria-pressed={isSelected}
              className={cn(
                '-mb-px flex h-12 items-center gap-1.5 border-b-2 text-body-strong whitespace-nowrap transition-colors',
                isSelected
                  ? 'border-brand text-foreground'
                  : 'border-transparent text-faint-foreground hover:text-foreground',
              )}
            >
              <span>{tab.label}</span>
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

  const topMembers = ranking.slice(0, 3);
  const listMembers = ranking.slice(3);
  const currentIndex = ranking.findIndex((member) => member.id === currentMembershipId);
  const currentMember = currentIndex >= 3 ? ranking[currentIndex] : null;

  return (
    <section className="space-y-5" aria-label="Ranking do grupo">
      <RankingPodium members={topMembers} currentMembershipId={currentMembershipId} />

      {currentMember && (
        <div className="space-y-2">
          <p className="px-1 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Sua posição
          </p>
          <RankingRow member={currentMember} rank={currentIndex + 1} isCurrent />
        </div>
      )}

      {listMembers.length > 0 && (
        <div className="space-y-3">
          {listMembers.map((member, index) => (
            <RankingRow
              key={member.id}
              member={member}
              rank={index + 4}
              isCurrent={member.id === currentMembershipId}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function RankingPodium({
  members,
  currentMembershipId,
}: {
  members: GroupMember[];
  currentMembershipId: string | null;
}) {
  const podium = [members[1], members[0], members[2]].filter(Boolean) as GroupMember[];

  return (
    <div className="grid grid-cols-3 items-end gap-2" aria-label="Top 3 do ranking">
      {podium.map((member) => {
        const rank = members.indexOf(member) + 1;
        const isLeader = rank === 1;
        const isCurrent = member.id === currentMembershipId;

        return (
          <Card
            key={member.id}
            className={
              isLeader
                ? 'bg-gradient-to-br from-foreground to-foreground/86 text-background'
                : isCurrent
                  ? 'bg-gradient-to-br from-card via-card to-primary/18 ring-2 ring-primary/35'
                  : 'bg-gradient-to-br from-card via-card to-accent/18'
            }
          >
            <CardContent
              className={`flex flex-col items-center justify-center text-center gap-2 ${isLeader ? 'h-44' : 'h-38'}`}
            >
              <span
                className={`flex shrink-0 items-center justify-center rounded-full font-bold ${
                  isLeader
                    ? 'h-12 w-12 bg-background text-foreground'
                    : 'h-10 w-10 bg-white/45 text-primary backdrop-blur-xl dark:bg-white/10'
                }`}
              >
                {rank}
              </span>

              <div className="min-w-0 space-y-1">
                <p
                  className={`truncate text-sm font-semibold ${isLeader ? 'text-background' : 'text-foreground'}`}
                >
                  <UserNameLink userId={member.userId}>{getFirstName(member)}</UserNameLink>
                </p>
                <p
                  className={cn(
                    'font-semibold tracking-tighter',
                    isLeader ? 'text-2xl' : 'text-xl',
                  )}
                >
                  {member.rating.toFixed(0)}
                </p>
                <div className="flex h-4 items-center justify-center">
                  {isCurrent ? (
                    <InlineBadge>Você</InlineBadge>
                  ) : (
                    <RankingMovementBadge movement={member.rankingMovement} />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function RankingRow({
  member,
  rank,
  isCurrent,
}: {
  member: GroupMember;
  rank: number;
  isCurrent: boolean;
}) {
  const isLeader = rank === 1;

  return (
    <Card
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

            <p className="text-xs text-muted-foreground">{getRankingDetail(member)}</p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-2xl font-semibold tracking-[-0.055em]">{member.rating.toFixed(0)}</p>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">rating</p>
        </div>
      </CardContent>
    </Card>
  );
}

function RankBadge({
  rank,
  isLeader,
  isCurrent,
}: {
  rank: number;
  isLeader: boolean;
  isCurrent: boolean;
}) {
  const className = isLeader
    ? 'bg-foreground text-background shadow-[0_12px_28px_color-mix(in_oklch,var(--foreground)_20%,transparent)]'
    : isCurrent
      ? 'bg-primary text-primary-foreground shadow-[0_12px_28px_color-mix(in_oklch,var(--primary)_20%,transparent)]'
      : 'bg-white/45 text-primary backdrop-blur-xl dark:bg-white/10';

  return (
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.35rem] text-sm font-bold ${className}`}
    >
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

function getRankingDetail(member: GroupMember) {
  const stats = member.stats ?? { matchesCount: 0, winsCount: 0 };
  const winRate =
    stats.matchesCount > 0 ? Math.round((stats.winsCount / stats.matchesCount) * 100) : 0;
  const detail = `${formatMatchesCount(stats.matchesCount)} · ${winRate}% vitórias`;

  return member.role === 'ADMIN' ? `${detail} · Admin` : detail;
}

function formatMatchesCount(count: number) {
  return `${count} ${count === 1 ? 'partida' : 'partidas'}`;
}

function getFirstName(member: GroupMember) {
  return getMemberDisplayName(member).split(' ')[0] ?? 'Jogador';
}

function getMemberDisplayName(member: GroupMember) {
  if (!member.user) {
    return 'Jogador';
  }

  return `${member.user.firstName} ${member.user.lastName}`.trim();
}
