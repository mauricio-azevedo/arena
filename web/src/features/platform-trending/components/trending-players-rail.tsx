'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Swords, Trophy } from 'lucide-react';
import { getPlatformTrendingPlayers } from '@/features/platform-trending/api/platform-trending.api';
import type { PlatformTrendingPlayer } from '@/features/platform-trending/types/platform-trending-player.type';
import { cn } from '@/lib/utils';

type LoadState = 'loading' | 'ready' | 'error';

export function TrendingPlayersRail() {
  const [state, setState] = useState<LoadState>('loading');
  const [players, setPlayers] = useState<PlatformTrendingPlayer[]>([]);

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      setState('loading');

      try {
        const data = await getPlatformTrendingPlayers();

        if (!isCurrent) {
          return;
        }

        setPlayers(data);
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
    return <TrendingPlayersSkeleton />;
  }

  if (state === 'error' || players.length === 0) {
    return null;
  }

  return (
    <section aria-label="Jogadores em alta" className="space-y-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-base font-semibold tracking-[-0.035em] text-foreground">
          Jogadores em alta
        </h2>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-primary ring-1 ring-primary/15">
          <Trophy className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>

      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {players.map((player, index) => (
          <TrendingPlayerChip key={player.userId} player={player} isFeatured={index === 0} />
        ))}
      </div>
    </section>
  );
}

function TrendingPlayerChip({
  player,
  isFeatured,
}: {
  player: PlatformTrendingPlayer;
  isFeatured: boolean;
}) {
  const href = player.highlightGroup ? `/groups/${player.highlightGroup.id}` : null;
  const content = <TrendingPlayerChipContent player={player} isFeatured={isFeatured} />;

  if (!href) {
    return (
      <article className={getChipClassName(isFeatured)} aria-label={getChipLabel(player)}>
        {content}
      </article>
    );
  }

  return (
    <Link href={href} className={getChipClassName(isFeatured)} aria-label={getChipLabel(player)}>
      {content}
    </Link>
  );
}

function TrendingPlayerChipContent({
  player,
}: {
  player: PlatformTrendingPlayer;
  isFeatured: boolean;
}) {
  return (
    <>
      <div className="min-w-0 space-y-1">
        <h3 className="flex min-w-0 items-baseline gap-2 text-lg font-semibold leading-tight tracking-[-0.05em] text-foreground">
          <span className="shrink-0 text-base font-bold text-primary">
            {formatOrdinal(player.trendRank)}
          </span>
          <span className="truncate">{player.displayName}</span>
        </h3>
        <p className="truncate text-xs font-medium leading-5 text-muted-foreground">
          {getHighlightLine(player)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <TrendMetric
          icon={Swords}
          label="partidas"
          value={player.recentMatches.toString()}
          historicalValue={player.allTimeMatches.toString()}
        />
        <TrendMetric
          icon={Trophy}
          label="vitórias"
          value={formatPercent(player.recentWinRate)}
          historicalValue={formatPercent(player.allTimeWinRate)}
        />
      </div>
    </>
  );
}

function TrendMetric({
  icon: Icon,
  label,
  value,
  historicalValue,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  historicalValue: string;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1 text-[11px] font-semibold lowercase leading-none tracking-[-0.005em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/85" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-2 truncate text-3xl font-semibold leading-none tracking-[-0.085em] text-foreground tabular-nums">
        {value}
        <span className="text-base font-semibold tracking-[-0.06em] text-muted-foreground">
          /{historicalValue}
        </span>
      </p>
    </div>
  );
}

function TrendingPlayersSkeleton() {
  return (
    <section className="space-y-3" aria-label="Carregando jogadores em alta" aria-busy="true">
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="h-4 w-32 animate-pulse rounded-full bg-muted" />
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="-mx-4 flex gap-3 overflow-hidden px-4 pb-1">
        {[0, 1].map((index) => (
          <div
            key={index}
            className="h-[8.75rem] w-[15.5rem] shrink-0 animate-pulse rounded-[1.75rem] bg-muted/80"
          />
        ))}
      </div>
    </section>
  );
}

function getChipClassName(isFeatured: boolean) {
  return cn(
    'block w-[15.5rem] shrink-0 snap-start space-y-4 rounded-[1.75rem] border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
    isFeatured
      ? 'border-primary/20 bg-gradient-to-br from-primary/14 via-card to-card shadow-md'
      : 'border-border bg-card/80 hover:bg-card',
  );
}

function getHighlightLine(player: PlatformTrendingPlayer) {
  const groupName = player.highlightGroup?.name;
  const rank = player.highlightGroupMember?.currentRank;

  if (groupName && rank) {
    return `#${rank} no ${groupName}`;
  }

  if (groupName) {
    return `em ${groupName}`;
  }

  return 'em alta no Arena';
}

function getChipLabel(player: PlatformTrendingPlayer) {
  return `${formatOrdinal(player.trendRank)} em jogadores em alta: ${player.displayName}. ${getHighlightLine(player)}.`;
}

function formatOrdinal(value: number) {
  return `${value}º`;
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) {
    return '0%';
  }

  return `${Math.round(value * 100)}%`;
}
