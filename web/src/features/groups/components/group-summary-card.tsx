'use client';

import Link from 'next/link';
import { ArrowDown, ArrowUp, Search, UserPlus } from 'lucide-react';
import type { Group, GroupMember, Match, MyGroup, RankingMovement } from '@/types/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Separator } from '@/components/ui/separator';

export type GroupSummaryCardProps = {
  group: Group;
  ranking: GroupMember[];
  members: GroupMember[];
  matches: Match[];
  membership: MyGroup | null;
};

export function GroupSummaryCard({ group, ranking, members, membership }: GroupSummaryCardProps) {
  const currentRankIndex = membership
    ? ranking.findIndex((member) => member.id === membership.id)
    : -1;
  const currentMember = membership
    ? (ranking[currentRankIndex] ?? members.find((member) => member.id === membership.id) ?? null)
    : null;
  const memberCount = group._count?.members ?? members.length;
  const currentRating = currentMember?.rating ?? membership?.rating ?? null;

  const standing =
    membership && currentRating !== null
      ? buildStanding(ranking, currentRankIndex, currentRating)
      : null;

  return (
    <div className="space-y-4">
      <GroupSearchField />

      {standing && (
        <Card>
          <CardContent className="space-y-4">
            <StandingSection
              standing={standing}
              rating={currentRating as number}
              movement={currentMember?.rankingMovement}
            />

            <Separator />

            <MembersFooter
              members={members}
              memberCount={memberCount}
              groupId={group.id}
              canInvite={membership?.role === 'ADMIN'}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

type Standing = {
  rank: number | null;
  progress: number;
  pointsToClimb: number | null;
  chasingName: string | null;
};

function buildStanding(ranking: GroupMember[], index: number, rating: number): Standing {
  if (index < 0) {
    return { rank: null, progress: 0, pointsToClimb: null, chasingName: null };
  }

  const rank = index + 1;
  const above = index > 0 ? ranking[index - 1] : null;
  const below = index < ranking.length - 1 ? ranking[index + 1] : null;

  if (!above) {
    return { rank, progress: 1, pointsToClimb: null, chasingName: null };
  }

  const pointsToClimb = Math.max(1, Math.ceil(above.rating - rating));

  // The bar maps the viewer's rating within the band between the member
  // directly above (the target, full bar) and the one directly below (empty
  // bar). Last place has no member below to anchor the band, so it reads empty.
  const progress = below
    ? clamp01((rating - below.rating) / Math.max(1, above.rating - below.rating))
    : 0;

  return { rank, progress, pointsToClimb, chasingName: getMemberFirstName(above) };
}

function getMemberFirstName(member?: GroupMember | null) {
  const name = member?.user?.firstName?.trim();
  return name ? name : null;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function GroupSearchField() {
  return (
    <InputGroup className="rounded-full bg-card">
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        placeholder="Buscar jogador ou partida"
        aria-label="Buscar jogador ou partida"
      />
    </InputGroup>
  );
}

function StandingSection({
  standing,
  rating,
  movement,
}: {
  standing: Standing;
  rating: number;
  movement?: RankingMovement | null;
}) {
  if (!standing.rank) {
    return (
      <div className="space-y-1">
        <p className="text-2xl font-semibold tracking-tight text-foreground">Sem posição ainda</p>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold tabular-nums text-foreground">{Math.round(rating)}</span>{' '}
          rating inicial
        </p>
      </div>
    );
  }

  const ratingDelta = movement
    ? Math.round(movement.currentRating - movement.previousRating)
    : null;
  const isLeading = standing.pointsToClimb === null;

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Minha posição
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-semibold leading-[0.78] tracking-tighter tabular-nums text-foreground">
              #{standing.rank}
            </span>
            {movement && <RankMovementBadge movement={movement} />}
          </div>
        </div>

        <div className="space-y-1.5 text-right">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Rating
          </p>
          <p className="flex items-baseline justify-end gap-1 text-lg font-semibold tabular-nums text-foreground">
            {Math.round(rating)}
            {ratingDelta !== null && ratingDelta !== 0 && <RatingDelta delta={ratingDelta} />}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${Math.round(standing.progress * 100)}%` }}
          />
        </div>

        {isLeading ? (
          <p className="text-[13px] font-semibold text-accent">Ninguém na sua frente</p>
        ) : (
          <p className="text-[13px] font-medium leading-snug text-muted-foreground">
            Faltam <span className="tabular-nums text-accent">{standing.pointsToClimb} pts</span>{' '}
            {standing.chasingName ? (
              <>
                pra passar <span className="text-foreground">{standing.chasingName}</span>
              </>
            ) : (
              'pra subir'
            )}
          </p>
        )}
      </div>
    </>
  );
}

function MembersFooter({
  members,
  memberCount,
  groupId,
  canInvite,
}: {
  members: GroupMember[];
  memberCount: number;
  groupId: string;
  canInvite: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <AvatarStack members={members} total={memberCount} />
        <span className="text-[13px] text-muted-foreground">
          {memberCount} {memberCount === 1 ? 'membro' : 'membros'}
        </span>
      </div>

      {canInvite && (
        <Button asChild variant="secondary" size="icon" className="rounded-full">
          <Link href={`/groups/${groupId}/invite`} aria-label="Convidar">
            <UserPlus className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}

function AvatarStack({ members, total }: { members: GroupMember[]; total: number }) {
  const shown = members.slice(0, 3);
  const remaining = total - shown.length;

  return (
    <div className="flex items-center">
      {shown.map((member, index) => (
        <span
          key={member.id}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground ring-1 ring-accent-dark',
            index > 0 && '-ml-2',
          )}
        >
          {getMemberInitial(member)}
        </span>
      ))}

      {remaining > 0 && (
        <span className="-ml-2 flex h-7 items-center justify-center rounded-full bg-accent/30 px-1.5 text-[10px] font-semibold text-accent-foreground ring-1 ring-accent-dark">
          +{remaining}
        </span>
      )}
    </div>
  );
}

function getMemberInitial(member: GroupMember) {
  const first = member.user?.firstName?.trim();
  return first ? first.charAt(0).toUpperCase() : '?';
}

function RankMovementBadge({ movement }: { movement: RankingMovement }) {
  const isUp = movement.direction === 'UP';
  const Icon = isUp ? ArrowUp : ArrowDown;
  const verb = isUp ? 'subiu' : 'caiu';
  const label = `${verb} ${movement.positions} ${movement.positions === 1 ? 'posição' : 'posições'}`;
  const className = isUp
    ? 'text-accent bg-accent/15'
    : 'text-rose-600 bg-rose-500/12 dark:text-rose-400';

  return (
    <span
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none tabular-nums ${className}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {movement.positions}
    </span>
  );
}

function RatingDelta({ delta }: { delta: number }) {
  const isUp = delta > 0;
  const Icon = isUp ? ArrowUp : ArrowDown;
  const className = isUp ? 'text-accent' : 'text-rose-600 dark:text-rose-400';

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[12px] font-semibold tabular-nums ${className}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {Math.abs(delta)}
    </span>
  );
}
