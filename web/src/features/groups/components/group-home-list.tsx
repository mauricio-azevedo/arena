'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Loader2,
  Plus,
  Trophy,
  UsersRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getGroupHome } from '@/features/groups/api/groups.api';
import type { GroupHomeActivity, GroupHomeCard } from '@/features/groups/types/group-home.type';
import { getGroupInitials } from '@/features/groups/helpers/group-initials.helper';
import { getAccessToken } from '@/lib/auth';
import { formatFeedItemTime } from '@/features/feed/helpers/feed-item-time.helper';
import type { DominantWinFeedMetadata } from '@/features/feed/types/dominant-win-feed-metadata.type';
import type { CloseMatchFeedMetadata } from '@/features/feed/types/close-match-feed-metadata.type';
import type { RankingMovementFeedMetadata } from '@/features/feed/types/ranking-movement-feed-metadata.type';

type LoadState = 'loading' | 'ready' | 'error';

export function GroupHomeList() {
  const [state, setState] = useState<LoadState>('loading');
  const [items, setItems] = useState<GroupHomeCard[]>([]);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    const token = getAccessToken();
    setHasToken(Boolean(token));

    async function load() {
      setState('loading');

      try {
        const data = await getGroupHome(token ?? undefined);

        if (!isCurrent) {
          return;
        }

        setItems(data);
        setState('ready');
      } catch {
        if (!isCurrent) {
          return;
        }

        setState('error');
      }
    }

    load();

    return () => {
      isCurrent = false;
    };
  }, []);

  if (state === 'loading') {
    return <GroupHomeLoadingState />;
  }

  if (state === 'error') {
    return <GroupHomeErrorState />;
  }

  if (items.length === 0) {
    return <GroupHomeEmptyState hasToken={hasToken} />;
  }

  const relationship = items[0]?.relationship;
  const isShowingSuggestions = relationship === 'PUBLIC_SUGGESTION';

  return (
    <section className="space-y-4">
      {isShowingSuggestions && <PublicSuggestionIntro hasToken={hasToken} />}

      <div className="space-y-3">
        {items.map((item) => (
          <GroupHomeCardView key={item.group.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function GroupHomeCardView({ item }: { item: GroupHomeCard }) {
  const isMember = item.relationship === 'MEMBER';
  const status = getGroupStatus(item);

  return (
    <Link href={`/groups/${item.group.id}`} className="block">
      <Card className="br-pressable overflow-hidden">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-primary/18 via-white/22 to-accent/55 text-sm font-bold text-primary ring-1 ring-primary/10 dark:via-white/8">
              {getGroupInitials(item.group.name)}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="min-w-0 truncate text-lg font-semibold tracking-[-0.035em]">
                  {item.group.name}
                </h2>
                {isMember && item.currentUser?.role === 'ADMIN' && (
                  <span className="shrink-0 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background">
                    Admin
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                {formatMembersCount(item.group.membersCount)}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <StatusPill status={status} />
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <CurrentUserStanding item={item} />
            <LeadershipSummary item={item} />
          </div>

          <LastRelevantActivity item={item} />
        </CardContent>
      </Card>
    </Link>
  );
}

function CurrentUserStanding({ item }: { item: GroupHomeCard }) {
  if (!item.currentUser) {
    return (
      <div className="rounded-[1.35rem] bg-white/42 px-3 py-3 shadow-[inset_0_1px_0_color-mix(in_oklch,white_58%,transparent)] backdrop-blur-xl dark:bg-white/8">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Grupo público
        </p>
        <p className="mt-1 text-sm font-semibold tracking-[-0.015em] text-foreground">
          Entre para competir
        </p>
      </div>
    );
  }

  const standing = item.currentUser.standing;

  if (standing.kind === 'UNRANKED') {
    return (
      <div className="rounded-[1.35rem] bg-white/42 px-3 py-3 shadow-[inset_0_1px_0_color-mix(in_oklch,white_58%,transparent)] backdrop-blur-xl dark:bg-white/8">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Você
        </p>
        <p className="mt-1 text-sm font-semibold tracking-[-0.015em] text-foreground">
          Ainda sem ranking
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {Math.round(standing.rating)} rating inicial
        </p>
      </div>
    );
  }

  const movement = standing.rankingMovement;
  const isLeader = standing.rank === 1;

  return (
    <div className="rounded-[1.35rem] bg-white/42 px-3 py-3 shadow-[inset_0_1px_0_color-mix(in_oklch,white_58%,transparent)] backdrop-blur-xl dark:bg-white/8">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Você
      </p>
      <div className="mt-1 flex items-center gap-2">
        <p className="text-sm font-semibold tracking-[-0.015em] text-foreground">
          {isLeader ? 'Você lidera' : `#${standing.rank} no ranking`}
        </p>
        {movement && <MovementBadge direction={movement.direction} positions={movement.positions} />}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{Math.round(standing.rating)} rating</p>
    </div>
  );
}

function LeadershipSummary({ item }: { item: GroupHomeCard }) {
  const leaders = item.leaders;

  if (leaders.length === 0) {
    return (
      <div className="rounded-[1.35rem] bg-white/42 px-3 py-3 shadow-[inset_0_1px_0_color-mix(in_oklch,white_58%,transparent)] backdrop-blur-xl dark:bg-white/8">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Liderança
        </p>
        <p className="mt-1 text-sm font-semibold tracking-[-0.015em] text-foreground">
          Ranking ainda não começou
        </p>
      </div>
    );
  }

  const leaderText = formatNames(leaders.map((leader) => leader.displayName));
  const rating = Math.round(leaders[0]?.rating ?? 0);

  return (
    <div className="rounded-[1.35rem] bg-white/42 px-3 py-3 shadow-[inset_0_1px_0_color-mix(in_oklch,white_58%,transparent)] backdrop-blur-xl dark:bg-white/8">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Trophy className="h-3 w-3" />
        Liderança
      </div>
      <p className="mt-1 truncate text-sm font-semibold tracking-[-0.015em] text-foreground">
        {leaderText}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{rating} rating</p>
    </div>
  );
}

function LastRelevantActivity({ item }: { item: GroupHomeCard }) {
  const activity = item.activity.lastRelevant;

  if (!activity) {
    return (
      <div className="rounded-[1.35rem] border border-dashed border-border/75 px-3 py-3">
        <p className="text-sm font-medium tracking-[-0.01em] text-foreground">
          Nenhum destaque competitivo ainda
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Quando houver partidas marcantes ou mudanças no ranking, elas aparecem aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[1.35rem] bg-gradient-to-br from-card via-card to-accent/24 px-3 py-3 ring-1 ring-border/70">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Último destaque
          </p>
          <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 tracking-[-0.015em] text-foreground">
            {getActivityHeadline(activity)}
          </p>
        </div>
        <p className="shrink-0 text-xs text-muted-foreground">
          {formatFeedItemTime(activity.occurredAt)}
        </p>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: ReturnType<typeof getGroupStatus> }) {
  const className =
    status.kind === 'failed'
      ? 'bg-rose-500/12 text-rose-700 dark:text-rose-300'
      : status.kind === 'processing'
        ? 'bg-amber-500/12 text-amber-700 dark:text-amber-300'
        : status.kind === 'active'
          ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'
          : 'bg-white/45 text-muted-foreground dark:bg-white/10';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold leading-none ${className}`}>
      {status.kind === 'processing' && <Loader2 className="h-3 w-3 animate-spin" />}
      {status.kind === 'failed' && <AlertTriangle className="h-3 w-3" />}
      {status.label}
    </span>
  );
}

function MovementBadge({ direction, positions }: { direction: 'UP' | 'DOWN'; positions: number }) {
  const isUp = direction === 'UP';
  const Icon = isUp ? ArrowUp : ArrowDown;
  const className = isUp
    ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'
    : 'bg-rose-500/12 text-rose-700 dark:text-rose-300';

  return (
    <span className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold leading-none ${className}`}>
      <Icon className="h-3 w-3" />
      {positions}
    </span>
  );
}

function PublicSuggestionIntro({ hasToken }: { hasToken: boolean }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold tracking-[-0.015em]">
            {hasToken ? 'Grupos públicos para conhecer' : 'Conheça grupos públicos'}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            Entre em um grupo para acompanhar ranking, partidas e atividade competitiva.
          </p>
        </div>

        {!hasToken && (
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/login?redirect=/groups">Entrar</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function GroupHomeLoadingState() {
  return (
    <section className="space-y-3">
      {[0, 1, 2].map((index) => (
        <Card key={index}>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-start gap-3">
              <div className="h-14 w-14 rounded-[1.5rem] bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded-full bg-muted" />
                <div className="h-3 w-1/3 rounded-full bg-muted" />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="h-20 rounded-[1.35rem] bg-muted" />
              <div className="h-20 rounded-[1.35rem] bg-muted" />
            </div>
            <div className="h-16 rounded-[1.35rem] bg-muted" />
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function GroupHomeErrorState() {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <p className="text-sm font-semibold">Não foi possível carregar os grupos</p>
        <p className="text-sm leading-6 text-muted-foreground">
          Verifique sua conexão e tente novamente.
        </p>
      </CardContent>
    </Card>
  );
}

function GroupHomeEmptyState({ hasToken }: { hasToken: boolean }) {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.35rem] bg-accent text-accent-foreground">
            <UsersRound className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold">
            {hasToken ? 'Seus grupos aparecem aqui' : 'Grupos aparecem aqui'}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            {hasToken
              ? 'Crie ou entre em um grupo para acompanhar ranking, partidas e atividade.'
              : 'Entre para criar grupos ou participar de rankings.'}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {hasToken ? (
            <Button asChild>
              <Link href="/groups/new">
                <Plus className="mr-2 h-4 w-4" />
                Criar grupo
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/login?redirect=/groups">Entrar</Link>
            </Button>
          )}

          {!hasToken && (
            <Button asChild variant="outline">
              <Link href="/register?redirect=/groups">Criar conta</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getGroupStatus(item: GroupHomeCard) {
  if (item.projection?.status === 'FAILED') {
    return { kind: 'failed' as const, label: 'Atenção' };
  }

  if (item.projection?.status === 'PROCESSING') {
    return { kind: 'processing' as const, label: 'Atualizando' };
  }

  if (item.activity.lastRelevantAt) {
    return { kind: 'active' as const, label: 'Ativo' };
  }

  return { kind: 'idle' as const, label: 'Parado' };
}

function getActivityHeadline(activity: GroupHomeActivity) {
  if (activity.type === 'RANKING_MOVEMENT') {
    const metadata = activity.metadata as Partial<RankingMovementFeedMetadata>;
    return typeof metadata.headline === 'string' && metadata.headline.trim()
      ? metadata.headline
      : 'Ranking movimentado depois da partida';
  }

  if (activity.type === 'MATCH_BLOWOUT') {
    const metadata = activity.metadata as Partial<DominantWinFeedMetadata>;
    return buildMatchHeadline(metadata, 'Atropelo');
  }

  if (activity.type === 'MATCH_CLOSE') {
    const metadata = activity.metadata as Partial<CloseMatchFeedMetadata>;
    return buildMatchHeadline(metadata, 'No detalhe');
  }

  return 'Novo destaque no grupo';
}

function buildMatchHeadline(
  metadata: Partial<DominantWinFeedMetadata | CloseMatchFeedMetadata>,
  prefix: string,
) {
  if (!Array.isArray(metadata.winners) || typeof metadata.gamesA !== 'number' || typeof metadata.gamesB !== 'number') {
    return `${prefix} na última partida`;
  }

  const winners = formatNames(
    metadata.winners
      .map((player) => player.displayName)
      .filter((name): name is string => Boolean(name)),
  );
  const winnerScore = Math.max(metadata.gamesA, metadata.gamesB);
  const loserScore = Math.min(metadata.gamesA, metadata.gamesB);

  if (!winners) {
    return `${prefix} por ${winnerScore}–${loserScore}`;
  }

  return `${prefix}: ${winners} venceram por ${winnerScore}–${loserScore}`;
}

function formatMembersCount(count: number) {
  return `${count} ${count === 1 ? 'membro' : 'membros'}`;
}

function formatNames(names: string[]) {
  const cleanNames = names.filter(Boolean);

  if (cleanNames.length === 0) {
    return '';
  }

  if (cleanNames.length === 1) {
    return cleanNames[0];
  }

  if (cleanNames.length === 2) {
    return `${cleanNames[0]} e ${cleanNames[1]}`;
  }

  return `${cleanNames[0]}, ${cleanNames[1]} e mais ${cleanNames.length - 2}`;
}
