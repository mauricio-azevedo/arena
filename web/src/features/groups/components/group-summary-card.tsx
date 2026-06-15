'use client';

import * as React from 'react';
import { ArrowDown, ArrowUp, Trophy, Users } from 'lucide-react';
import type { Group, GroupMember, Match, MyGroup, RankingMovement } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';

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
  const leader = ranking[0] ?? null;
  const latestMatch = matches[0] ?? null;
  const memberCount = group._count?.members ?? members.length;
  const activeMatchCount = matches.length;

  return (
    <Card className="bg-gradient-to-br from-card via-card to-primary/10">
      <CardContent className="space-y-5 p-5">
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary/75">
            Estado do grupo
          </p>

          {membership ? (
            <div className="space-y-1.5">
              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">Sua posição</p>
                  <h2 className="truncate text-3xl font-semibold tracking-[-0.06em]">
                    {currentRank ? `${currentRank}º no ranking` : 'Sem posição ainda'}
                  </h2>
                </div>

                <div className="shrink-0 rounded-[1.35rem] bg-foreground px-4 py-2 text-right text-background shadow-[0_16px_36px_color-mix(in_oklch,var(--foreground)_18%,transparent)]">
                  <p className="text-2xl font-semibold leading-none tracking-[-0.06em]">
                    {(currentMember?.rating ?? membership.rating).toFixed(0)}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-background/70">
                    rating
                  </p>
                </div>
              </div>

              <MovementSummary movement={currentMember?.rankingMovement} ranked={Boolean(currentRank)} />
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-muted-foreground">Grupo público</p>
              <h2 className="text-3xl font-semibold tracking-[-0.06em]">Acompanhe o ranking</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Entre no grupo para registrar partidas e aparecer na disputa.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <SummaryStat
            label="Líder"
            value={leader ? getMemberDisplayName(leader) : 'Sem líder'}
            detail={leader ? `${leader.rating.toFixed(0)} rating` : 'Registre partidas'}
            icon={<Trophy className="h-4 w-4" />}
          />

          <SummaryStat
            label="Grupo"
            value={`${memberCount} ${memberCount === 1 ? 'membro' : 'membros'}`}
            detail={`${activeMatchCount} ${activeMatchCount === 1 ? 'partida' : 'partidas'}`}
            icon={<Users className="h-4 w-4" />}
          />
        </div>

        <div className="rounded-[1.5rem] bg-white/40 px-4 py-3 text-sm leading-6 text-muted-foreground ring-1 ring-border/50 backdrop-blur-xl dark:bg-white/8">
          {latestMatch ? formatLatestMatch(latestMatch) : 'Nenhuma partida registrada ainda.'}
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryStat({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] bg-white/40 p-4 ring-1 ring-border/50 backdrop-blur-xl dark:bg-white/8">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        {icon}
      </div>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold tracking-[-0.01em]">{value}</p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function MovementSummary({ movement, ranked }: { movement?: RankingMovement | null; ranked: boolean }) {
  if (!ranked) {
    return <p className="text-sm leading-6 text-muted-foreground">Registre partidas para entrar no ranking.</p>;
  }

  if (!movement) {
    return <p className="text-sm leading-6 text-muted-foreground">Sem mudança recente de posição.</p>;
  }

  const isUp = movement.direction === 'UP';
  const Icon = isUp ? ArrowUp : ArrowDown;
  const verb = isUp ? 'Subiu' : 'Caiu';

  return (
    <p className="inline-flex items-center gap-1.5 rounded-full bg-white/42 px-3 py-1 text-sm font-semibold text-foreground ring-1 ring-border/50 backdrop-blur-xl dark:bg-white/8">
      <Icon className={isUp ? 'h-4 w-4 text-emerald-600' : 'h-4 w-4 text-rose-600'} />
      {verb} {movement.positions} {movement.positions === 1 ? 'posição' : 'posições'} na última atualização.
    </p>
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
