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
  Users,
  UsersRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SignedOutCtaCard } from '@/features/auth/components/signed-out-cta-card';
import { getGroupHome } from '@/features/groups/api/groups.api';
import type { GroupHomeActivity, GroupHomeCard } from '@/features/groups/types/group-home.type';
import { getGroupInitials } from '@/features/groups/helpers/group-initials.helper';
import { getAccessToken } from '@/lib/auth';
import { formatFeedItemTime } from '@/features/feed/helpers/feed-item-time.helper';
import type { DominantWinFeedMetadata } from '@/features/feed/types/dominant-win-feed-metadata.type';
import type { CloseMatchFeedMetadata } from '@/features/feed/types/close-match-feed-metadata.type';
import type { RankingMovementFeedMetadata } from '@/features/feed/types/ranking-movement-feed-metadata.type';

type LoadState = 'loading' | 'ready' | 'error';
type GroupSystemStatus =
  | { kind: 'failed'; label: 'Atenção' }
  | { kind: 'processing'; label: 'Atualizando' };
type StandingDisplay = {
  rank: number | null;
  headline: string;
  movement: { direction: 'UP' | 'DOWN'; positions: number } | null;
  rating: number | null;
  ratingSuffix: 'rating' | 'rating inicial' | null;
};
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
  const memberItems = items.filter((item) => item.relationship === 'MEMBER');
  const suggestionItems = items.filter((item) => item.relationship === 'PUBLIC_SUGGESTION');
  if (memberItems.length === 0) {
    return (
      <section className="space-y-4">
        {hasToken && <PublicSuggestionIntro />}
        <div className="space-y-3">
          {suggestionItems.map((item) => (
            <DiscoveryGroupCard key={item.group.id} item={item} />
          ))}
        </div>
        {!hasToken && (
          <SignedOutCtaCard
            icon={UsersRound}
            title="Crie sua conta para competir"
            description="Salve grupos, acompanhe rankings e registre partidas."
            redirectPath="/"
            primaryAction="register"
          />
        )}
      </section>
    );
  }
  const featuredItem = memberItems[0]!;
  const compactItems = memberItems.slice(1);
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3 px-1">
        <Users className="h-4 w-4" aria-hidden="true" />
        <h2 className="text-base font-semibold tracking-[-0.035em] text-foreground">Meus Grupos</h2>
      </div>
      {memberItems.length > 1 && <HomeTopline items={memberItems} />}
      <FeaturedGroupCard item={featuredItem} />
      {compactItems.length > 0 && (
        <div className="space-y-3">
          {compactItems.map((item) => (
            <CompactGroupCard key={item.group.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
function HomeTopline({ items }: { items: GroupHomeCard[] }) {
  const bestRank = getBestRank(items);
  const latestItem = getLatestActivityItem(items);
  const latestLine = latestItem
    ? `${formatFeedItemTime(getActivityDate(latestItem))} em ${latestItem.group.name}`
    : 'Registre uma partida para movimentar o ranking';
  const primaryLine = `${formatGroupsCount(items.length)}${bestRank ? ` · melhor #${bestRank}` : ''}`;
  return (
    <div className="flex items-start justify-between gap-4 px-1">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-semibold tracking-[-0.015em] text-foreground">{primaryLine}</p>
        <p className="text-sm leading-6 text-muted-foreground">{latestLine}</p>
      </div>
      <Button asChild size="icon" variant="secondary" className="h-11 w-11 shrink-0 rounded-full">
        <Link href="/groups/new" aria-label="Criar grupo">
          <Plus className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
function FeaturedGroupCard({ item }: { item: GroupHomeCard }) {
  const systemStatus = getGroupSystemStatus(item);
  const standing = getStandingDisplay(item);
  const leaderLine = getLeaderLine(item, standing);
  const activityLine = getActivityLine(item);
  return (
    <Card className="bg-gradient-to-br from-card via-card to-primary/12">
      <CardContent className="space-y-4 p-4">
        <Link
          href={`/groups/${item.group.id}`}
          className="block rounded-[2rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <GroupAvatar name={item.group.name} size="lg" />
              <div className="min-w-0 flex-1 space-y-1">
                <h2 className="min-w-0 truncate text-lg font-semibold tracking-[-0.035em]">
                  {item.group.name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {formatMembersCount(item.group.membersCount)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {systemStatus && <SystemStatusBadge status={systemStatus} />}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2 rounded-[1.75rem] bg-white/42 p-4 ring-1 ring-border/50 backdrop-blur-xl dark:bg-white/8">
              <div className="min-w-0 space-y-1">
                <FeaturedStanding standing={standing} />
                <RatingText standing={standing} size="featured" />
              </div>
              <div className="space-y-1 border-t border-border/50 pt-3 text-sm leading-6">
                <p className="text-foreground">{leaderLine}</p>
                {activityLine && (
                  <p className="line-clamp-1 text-muted-foreground">{activityLine}</p>
                )}
              </div>
            </div>
          </div>
        </Link>
        <Button asChild size="lg" className="h-12 w-full rounded-full font-semibold">
          <Link href={`/groups/${item.group.id}/matches/new`}>
            <Plus className="h-4 w-4" /> Registrar partida
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
function FeaturedStanding({ standing }: { standing: StandingDisplay }) {
  if (!standing.rank) {
    return (
      <p className="text-3xl font-semibold tracking-[-0.075em] text-foreground">
        {standing.headline}
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
      <p className="text-5xl font-semibold leading-none tracking-[-0.09em] text-foreground">
        #{standing.rank}
      </p>
      <div className="flex items-center gap-2 pb-1.5">
        <p className="text-sm font-semibold text-muted-foreground">
          {standing.rank === 1 ? 'liderando' : 'no ranking'}
        </p>
        {standing.movement && <MovementBadge movement={standing.movement} />}
      </div>
    </div>
  );
}
function CompactGroupCard({ item }: { item: GroupHomeCard }) {
  const systemStatus = getGroupSystemStatus(item);
  const standing = getStandingDisplay(item);
  const leaderLine = getLeaderLine(item, standing);
  const activityLine = getActivityLine(item);
  return (
    <Link href={`/groups/${item.group.id}`} className="block">
      <Card className="br-pressable hover:bg-card/95">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start gap-3">
            <GroupAvatar name={item.group.name} />
            <div className="min-w-0 flex-1">
              <h2 className="min-w-0 truncate text-base font-semibold tracking-[-0.025em]">
                {item.group.name}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatMembersCount(item.group.membersCount)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {systemStatus && <SystemStatusBadge status={systemStatus} />}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-lg font-semibold tracking-[-0.045em]">
                {standing.headline}
              </p>
              {standing.movement && <MovementBadge movement={standing.movement} />}
            </div>
            <RatingText standing={standing} size="compact" />
          </div>
          <p className="line-clamp-1 text-sm text-muted-foreground">
            {activityLine ? `${leaderLine} · ${activityLine}` : leaderLine}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
function DiscoveryGroupCard({ item }: { item: GroupHomeCard }) {
  const leaderLine = getLeaderLine(item);
  const activityLine = getActivityLine(item);
  return (
    <Link href={`/groups/${item.group.id}`} className="block">
      <Card className="br-pressable hover:bg-card/95">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start gap-3">
            <GroupAvatar name={item.group.name} />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-semibold tracking-[-0.025em]">
                {item.group.name}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatMembersCount(item.group.membersCount)}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            {activityLine ? `${leaderLine} · ${activityLine}` : leaderLine}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
function RatingText({
  standing,
  size,
}: {
  standing: StandingDisplay;
  size: 'featured' | 'compact';
}) {
  if (standing.rating === null || !standing.ratingSuffix) {
    return null;
  }
  return (
    <p
      className={
        size === 'featured' ? 'text-sm text-muted-foreground' : 'text-xs text-muted-foreground'
      }
    >
      <span className="font-semibold text-foreground">{Math.round(standing.rating)}</span>{' '}
      {standing.ratingSuffix}
    </p>
  );
}
function GroupAvatar({ name, size = 'default' }: { name: string; size?: 'default' | 'lg' }) {
  const className =
    size === 'lg' ? 'h-14 w-14 rounded-[1.45rem] text-base' : 'h-11 w-11 rounded-[1.25rem] text-sm';
  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-muted font-semibold text-foreground ${className}`}
    >
      {getGroupInitials(name)}
    </div>
  );
}
function SystemStatusBadge({ status }: { status: GroupSystemStatus }) {
  const isFailed = status.kind === 'failed';
  const Icon = isFailed ? AlertTriangle : Loader2;
  const className = isFailed
    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium leading-none ${className}`}
    >
      <Icon className={`h-3 w-3 ${status.kind === 'processing' ? 'animate-spin' : ''}`} />
      {status.label}
    </span>
  );
}
function MovementBadge({
  movement,
}: {
  movement: { direction: 'UP' | 'DOWN'; positions: number };
}) {
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
      <Icon className="h-3 w-3" /> {movement.positions}
    </span>
  );
}
function PublicSuggestionIntro() {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="text-sm font-semibold text-foreground">Entre em uma disputa</p>
        <p className="text-sm leading-6 text-muted-foreground">
          Escolha um grupo público e acompanhe o ranking antes de jogar.
        </p>
      </CardContent>
    </Card>
  );
}
function GroupHomeLoadingState() {
  return (
    <section className="space-y-5">
      <div className="flex items-start justify-between gap-4 px-1">
        <div className="space-y-2">
          <div className="h-4 w-40 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-52 animate-pulse rounded-full bg-muted/70" />
        </div>
        <div className="h-11 w-11 animate-pulse rounded-full bg-muted" />
      </div>
      <Card className="bg-gradient-to-br from-card via-card to-primary/12">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-start gap-3">
            <div className="h-14 w-14 animate-pulse rounded-[1.45rem] bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-2/3 animate-pulse rounded-full bg-muted" />
              <div className="h-3 w-1/3 animate-pulse rounded-full bg-muted/70" />
            </div>
          </div>
          <div className="h-36 animate-pulse rounded-[1.75rem] bg-muted/70" />
          <div className="h-12 animate-pulse rounded-full bg-muted" />
        </CardContent>
      </Card>
      <section className="space-y-3">
        {[0, 1].map((index) => (
          <Card key={index}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 animate-pulse rounded-[1.25rem] bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 animate-pulse rounded-full bg-muted" />
                  <div className="h-3 w-1/3 animate-pulse rounded-full bg-muted/70" />
                </div>
              </div>
              <div className="h-14 animate-pulse rounded-[1.5rem] bg-muted/70" />
            </CardContent>
          </Card>
        ))}
      </section>
    </section>
  );
}
function GroupHomeErrorState() {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <p className="text-sm font-medium text-foreground">Não foi possível carregar seus grupos</p>
        <p className="text-sm leading-6 text-muted-foreground">
          Verifique sua conexão e tente novamente.
        </p>
      </CardContent>
    </Card>
  );
}
function GroupHomeEmptyState({ hasToken }: { hasToken: boolean }) {
  if (!hasToken) {
    return (
      <SignedOutCtaCard
        icon={UsersRound}
        title="Comece no Arena"
        description="Crie sua conta para salvar grupos, acompanhar rankings e registrar partidas."
        redirectPath="/"
        primaryAction="register"
      />
    );
  }
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="space-y-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-[1.25rem] bg-muted text-foreground">
            <UsersRound className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-foreground">Crie seu primeiro grupo</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Convide seus amigos, registre partidas e acompanhe o ranking.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button asChild className="rounded-full">
            <Link href="/groups/new">
              <Plus className="mr-2 h-4 w-4" /> Criar grupo
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
function getGroupSystemStatus(item: GroupHomeCard): GroupSystemStatus | null {
  if (item.projection?.status === 'FAILED') {
    return { kind: 'failed', label: 'Atenção' };
  }
  if (item.projection?.status === 'PROCESSING') {
    return { kind: 'processing', label: 'Atualizando' };
  }
  return null;
}
function getStandingDisplay(item: GroupHomeCard): StandingDisplay {
  if (!item.currentUser) {
    return {
      rank: null,
      headline: 'Entre para competir',
      movement: null,
      rating: null,
      ratingSuffix: null,
    };
  }
  const standing = item.currentUser.standing;
  if (standing.kind === 'UNRANKED') {
    return {
      rank: null,
      headline: 'Pronto para começar',
      movement: null,
      rating: standing.rating,
      ratingSuffix: 'rating inicial',
    };
  }
  return {
    rank: standing.rank,
    headline: standing.rank === 1 ? 'Você lidera' : `#${standing.rank} no ranking`,
    movement: standing.rankingMovement,
    rating: standing.rating,
    ratingSuffix: 'rating',
  };
}
function getLeaderLine(item: GroupHomeCard, standing?: StandingDisplay) {
  const leader = item.leaders[0];
  if (!leader) {
    return 'Ranking ainda não começou';
  }
  if (standing?.rank && standing.rating !== null) {
    if (standing.rank === 1) {
      return 'Você lidera';
    }
    const gap = Math.round(leader.rating - standing.rating);
    if (gap > 0) {
      return `${gap} ${gap === 1 ? 'ponto' : 'pontos'} até o líder`;
    }
  }
  return `${getFirstName(leader.displayName)} lidera · ${Math.round(leader.rating)}`;
}
function getActivityLine(item: GroupHomeCard) {
  const activity = item.activity.lastRelevant;
  if (!activity) {
    return null;
  }
  return `${formatFeedItemTime(activity.occurredAt)} · ${getActivityHeadline(activity)}`;
}
function getActivityDate(item: GroupHomeCard) {
  return (
    item.activity.lastRelevant?.occurredAt ?? item.activity.lastRelevantAt ?? item.group.updatedAt
  );
}
function getLatestActivityItem(items: GroupHomeCard[]) {
  return items.reduce<GroupHomeCard | null>((latest, item) => {
    if (!item.activity.lastRelevantAt && !item.activity.lastRelevant) {
      return latest;
    }
    if (!latest) {
      return item;
    }
    return getTime(getActivityDate(item)) > getTime(getActivityDate(latest)) ? item : latest;
  }, null);
}
function getBestRank(items: GroupHomeCard[]) {
  const ranks = items
    .map((item) => item.currentUser?.standing)
    .filter(
      (
        standing,
      ): standing is Extract<
        NonNullable<GroupHomeCard['currentUser']>['standing'],
        { kind: 'RANKED' }
      > => Boolean(standing && standing.kind === 'RANKED'),
    )
    .map((standing) => standing.rank);
  return ranks.length > 0 ? Math.min(...ranks) : null;
}
function getActivityHeadline(activity: GroupHomeActivity) {
  if (activity.type === 'RANKING_MOVEMENT') {
    const metadata = activity.metadata as Partial<RankingMovementFeedMetadata>;
    return typeof metadata.headline === 'string' && metadata.headline.trim()
      ? metadata.headline
      : 'Ranking mudou depois da partida';
  }
  if (activity.type === 'MATCH_BLOWOUT') {
    const metadata = activity.metadata as Partial<DominantWinFeedMetadata>;
    return buildMatchHeadline(metadata);
  }
  if (activity.type === 'MATCH_CLOSE') {
    const metadata = activity.metadata as Partial<CloseMatchFeedMetadata>;
    return buildMatchHeadline(metadata);
  }
  return 'Novo destaque no grupo';
}
function buildMatchHeadline(metadata: Partial<DominantWinFeedMetadata | CloseMatchFeedMetadata>) {
  if (typeof metadata.gamesA !== 'number' || typeof metadata.gamesB !== 'number') {
    return 'Partida registrada';
  }
  const winnerScore = Math.max(metadata.gamesA, metadata.gamesB);
  const loserScore = Math.min(metadata.gamesA, metadata.gamesB);
  if (!Array.isArray(metadata.winners)) {
    return `Partida terminou ${winnerScore}–${loserScore}`;
  }
  const winnerNames = metadata.winners
    .map((player) => player.displayName)
    .filter((name): name is string => Boolean(name));
  const winners = formatNames(winnerNames);
  if (!winners) {
    return `Partida terminou ${winnerScore}–${loserScore}`;
  }
  return `${winners} ${winnerNames.length === 1 ? 'venceu' : 'venceram'} por ${winnerScore}–${loserScore}`;
}
function formatGroupsCount(count: number) {
  return `${count} ${count === 1 ? 'grupo' : 'grupos'}`;
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
function getFirstName(name: string) {
  return name.trim().split(' ')[0] || 'Jogador';
}
function getTime(value: string | Date | null) {
  return value ? new Date(value).getTime() : 0;
}
