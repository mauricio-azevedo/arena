import { ArrowDown, ArrowUp } from 'lucide-react';
import type { GroupMember, RankingMovement } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';
import { Body, Heading, Label, Meta, Overline, Stat } from '@/components/ui/text';
import { UserNameLink } from '@/features/users/components/user-name-link';
import { avatarBgClass, nameInitial } from '@/lib/avatar';
import { cn } from '@/lib/utils';

type Props = {
  ranking: GroupMember[];
  currentMembershipId: string | null;
};

export function RankingList({ ranking, currentMembershipId }: Props) {
  if (ranking.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-2 p-4">
          <Label className="block text-foreground">Nenhum jogador no ranking ainda</Label>
          <Body className="text-muted-foreground">
            Registre partidas para transformar os membros em uma disputa real.
          </Body>
        </CardContent>
      </Card>
    );
  }

  return (
    <section aria-label="Ranking do grupo" className="space-y-3">
      <div className="flex items-baseline justify-between px-0.5">
        <Heading>Classificação</Heading>
        <Meta className="text-faint-foreground">Rating</Meta>
      </div>

      <div className="overflow-hidden rounded-3xl bg-card shadow-card">
        {ranking.map((member, index) => (
          <RankingRow
            key={member.id}
            member={member}
            rank={index + 1}
            isCurrent={member.id === currentMembershipId}
          />
        ))}
      </div>
    </section>
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
  const fullName = getMemberDisplayName(member);

  const rankColor =
    rank === 1
      ? 'text-medal-1'
      : rank === 2
        ? 'text-medal-2'
        : rank === 3
          ? 'text-medal-3'
          : isCurrent
            ? 'text-foreground'
            : 'text-faint-foreground';

  return (
    <div
      className={cn(
        'flex items-center gap-3 border-t border-divider px-4 py-3 first:border-t-0',
        isCurrent && 'bg-brand/15',
      )}
    >
      <Stat size="sm" className={cn('w-6 shrink-0 text-center', rankColor)}>
        {rank}
      </Stat>

      <Meta
        className={cn(
          'flex size-[38px] shrink-0 items-center justify-center rounded-full shadow-[inset_0_0_0_1px_var(--border)]',
          avatarBgClass(member.id),
          isCurrent ? 'text-brand' : 'text-muted-foreground',
        )}
        aria-hidden
      >
        {nameInitial(fullName)}
      </Meta>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <Label className="min-w-0 truncate text-foreground">
            <UserNameLink userId={member.userId}>{fullName}</UserNameLink>
          </Label>

          {isCurrent && (
            <span className="shrink-0 rounded-md bg-brand/20 px-1.5 py-0.5 text-brand">
              <Overline className="text-brand">Você</Overline>
            </span>
          )}

          <Movement movement={member.rankingMovement} />
        </div>

        <Meta className="text-muted-foreground">{getStatsLine(member)}</Meta>
      </div>

      <Stat size="sm" className="shrink-0 text-foreground">
        {member.rating.toFixed(0)}
      </Stat>
    </div>
  );
}

function Movement({ movement }: { movement?: RankingMovement | null }) {
  if (!movement) {
    return null;
  }

  const isUp = movement.direction === 'UP';
  const Icon = isUp ? ArrowUp : ArrowDown;
  const label = `${isUp ? 'Subiu' : 'Caiu'} ${movement.positions} ${
    movement.positions === 1 ? 'posição' : 'posições'
  }`;

  return (
    <Meta
      aria-label={label}
      className={cn('inline-flex shrink-0 items-center gap-0.5', isUp ? 'text-success' : 'text-danger')}
    >
      <Icon className="size-2.5" strokeWidth={3.2} aria-hidden />
      {movement.positions}
    </Meta>
  );
}

function getMemberDisplayName(member: GroupMember) {
  if (!member.user) {
    return 'Jogador';
  }

  return `${member.user.firstName} ${member.user.lastName}`.trim() || 'Jogador';
}

function getStatsLine(member: GroupMember) {
  const stats = member.stats ?? { matchesCount: 0, winsCount: 0 };

  if (stats.matchesCount === 0) {
    return 'Sem partidas';
  }

  const winPct = Math.round((stats.winsCount / stats.matchesCount) * 100);

  return `${stats.matchesCount} jogos · ${winPct}% vit.`;
}
