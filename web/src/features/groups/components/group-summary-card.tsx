'use client';

import { ArrowDown, ArrowUp } from 'lucide-react';
import type { Group, GroupMember, Match, MyGroup, RankingMovement } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';
import { getGroupInitials } from '@/features/groups/helpers/group-initials.helper';

export type GroupSummaryCardProps = {
  group: Group;
  ranking: GroupMember[];
  members: GroupMember[];
  matches: Match[];
  membership: MyGroup | null;
};

export function GroupSummaryCard({
  group,
  ranking,
  members,
  matches,
  membership,
}: GroupSummaryCardProps) {
  const currentRankIndex = membership
    ? ranking.findIndex((member) => member.id === membership.id)
    : -1;
  const currentRank = currentRankIndex >= 0 ? currentRankIndex + 1 : null;
  const currentMember = membership
    ? (ranking[currentRankIndex] ?? members.find((member) => member.id === membership.id) ?? null)
    : null;
  const latestMatch = matches[0] ?? null;
  const memberCount = group._count?.members ?? members.length;
  const matchCount = group._count?.matches ?? matches.length;
  const currentRating = currentMember?.rating ?? membership?.rating ?? null;

  return (
    <Card className="bg-gradient-to-br from-card via-card to-primary/10">
      <CardContent className="space-y-5 p-5">
        <GroupHeader group={group} memberCount={memberCount} matchCount={matchCount} />

        {membership && currentRating !== null && (
          <CurrentMemberSummary
            rank={currentRank}
            rating={currentRating}
            movement={currentMember?.rankingMovement}
          />
        )}

        <LatestActivity latestMatch={latestMatch} />
      </CardContent>
    </Card>
  );
}

function GroupHeader({
  group,
  memberCount,
  matchCount,
}: {
  group: Group;
  memberCount: number;
  matchCount: number;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <GroupAvatar name={group.name} />

        <div className="grid shrink-0 grid-cols-2 gap-2">
          <MetricPill value={memberCount} label={memberCount === 1 ? 'membro' : 'membros'} />
          <MetricPill value={matchCount} label={matchCount === 1 ? 'partida' : 'partidas'} />
        </div>
      </div>

      {group.description && (
        <p className="text-sm leading-6 text-muted-foreground">{group.description}</p>
      )}
    </div>
  );
}

function GroupAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.45rem] bg-muted text-base font-semibold text-foreground">
      {getGroupInitials(name)}
    </div>
  );
}

function MetricPill({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-16 rounded-[1.2rem] bg-white/42 px-3 py-2 text-center ring-1 ring-border/50 backdrop-blur-xl dark:bg-white/8">
      <p className="text-lg font-semibold leading-none tracking-[-0.05em] text-foreground">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function CurrentMemberSummary({
  rank,
  rating,
  movement,
}: {
  rank: number | null;
  rating: number;
  movement?: RankingMovement | null;
}) {
  return (
    <div className="space-y-2 rounded-[1.75rem] bg-white/42 p-4 ring-1 ring-border/50 backdrop-blur-xl dark:bg-white/8">
      <MemberStanding rank={rank} movement={movement} />
      <MemberRating rating={rating} isRanked={Boolean(rank)} />
    </div>
  );
}

function MemberStanding({
  rank,
  movement,
}: {
  rank: number | null;
  movement?: RankingMovement | null;
}) {
  if (!rank) {
    return (
      <p className="text-2xl font-semibold tracking-[-0.06em] text-foreground">
        Sem posição ainda
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
      <p className="text-5xl font-semibold leading-none tracking-[-0.09em] text-foreground">
        #{rank}
      </p>

      <div className="flex items-center gap-2 pb-1.5">
        <p className="text-sm font-semibold text-muted-foreground">
          {rank === 1 ? 'liderando' : 'no ranking'}
        </p>
        {movement && <MovementBadge movement={movement} />}
      </div>
    </div>
  );
}

function MemberRating({ rating, isRanked }: { rating: number; isRanked: boolean }) {
  return (
    <p className="text-sm text-muted-foreground">
      <span className="font-semibold text-foreground">{Math.round(rating)}</span>{' '}
      {isRanked ? 'rating' : 'rating inicial'}
    </p>
  );
}

function MovementBadge({ movement }: { movement: RankingMovement }) {
  const isUp = movement.direction === 'UP';
  const Icon = isUp ? ArrowUp : ArrowDown;
  const verb = isUp ? 'subiu' : 'caiu';
  const label = `${verb} ${movement.positions} ${movement.positions === 1 ? 'posição' : 'posições'}`;
  const className = isUp
    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300';

  return (
    <span
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none ${className}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {movement.positions}
    </span>
  );
}

function LatestActivity({ latestMatch }: { latestMatch: Match | null }) {
  return (
    <div className="rounded-[1.5rem] bg-white/40 px-4 py-3 text-sm leading-6 text-muted-foreground ring-1 ring-border/50 backdrop-blur-xl dark:bg-white/8">
      {latestMatch ? formatLatestMatch(latestMatch) : 'Nenhuma partida registrada ainda.'}
    </div>
  );
}

function formatLatestMatch(match: Match) {
  const teamA = getTeamPlayers(match, 'TEAM_A');
  const teamB = getTeamPlayers(match, 'TEAM_B');
  const teamAWon = match.gamesA > match.gamesB;
  const winner = teamAWon ? teamA : teamB;
  const loser = teamAWon ? teamB : teamA;

  return `${formatTeamNames(winner)} venceu ${formatTeamNames(loser)} por ${match.gamesA}–${match.gamesB} · ${formatRelativeDate(match.playedAt)}`;
}

function getTeamPlayers(match: Match, team: 'TEAM_A' | 'TEAM_B') {
  return match.players
    .filter((player) => player.team === team)
    .sort((a, b) => a.position - b.position);
}

function formatTeamNames(players: Match['players']) {
  if (players.length === 0) {
    return 'Dupla não encontrada';
  }

  return players.map((player) => getMemberDisplayName(player.groupMember)).join(' / ');
}

function getMemberDisplayName(member?: GroupMember | null) {
  if (!member?.user) {
    return 'Jogador';
  }

  return `${member.user.firstName} ${member.user.lastName}`.trim();
}

function formatRelativeDate(date: string) {
  const playedAt = startOfDay(new Date(date));
  const today = startOfDay(new Date());
  const diffInDays = Math.round((today.getTime() - playedAt.getTime()) / 86_400_000);

  if (diffInDays === 0) {
    return 'hoje';
  }

  if (diffInDays === 1) {
    return 'ontem';
  }

  if (diffInDays > 1 && diffInDays < 7) {
    return `há ${diffInDays} dias`;
  }

  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
