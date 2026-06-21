'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getWeeklyHighlights } from '@/features/weekly-highlights/api/weekly-highlights.api';
import {
  highlightSentence,
  initialsFromName,
} from '@/features/weekly-highlights/helpers/highlight-copy';
import type { WeeklyHighlightCard } from '@/features/weekly-highlights/types/weekly-highlight.type';
import { getAccessToken } from '@/lib/auth';
import { cn } from '@/lib/utils';

type LoadState = 'loading' | 'ready' | 'error';

export function WeeklyHighlightsRail() {
  const [state, setState] = useState<LoadState>('loading');
  const [cards, setCards] = useState<WeeklyHighlightCard[]>([]);

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      setState('loading');

      try {
        const data = await getWeeklyHighlights(getAccessToken() ?? undefined);

        if (!isCurrent) {
          return;
        }

        setCards(data);
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
    return <WeeklyHighlightsSkeleton />;
  }

  if (state === 'error' || cards.length === 0) {
    return null;
  }

  return (
    <section aria-label="Essa semana" className="space-y-3">
      <div className="flex items-center gap-3 px-1">
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        <h2 className="text-base font-semibold tracking-[-0.035em] text-foreground">
          Essa semana
        </h2>
      </div>

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {cards.map((card, index) => (
          <HighlightChip
            key={`${card.userId}-${card.achievement.type}`}
            card={card}
            isFeatured={index === 0}
          />
        ))}
      </div>
    </section>
  );
}

function HighlightChip({
  card,
  isFeatured,
}: {
  card: WeeklyHighlightCard;
  isFeatured: boolean;
}) {
  const sentence = highlightSentence(card.achievement.type, card.achievement.value);

  return (
    <Link
      href={`/groups/${card.group.id}`}
      className={getChipClassName(isFeatured)}
      aria-label={`${card.displayName}: ${sentence}. ${card.group.name}.`}
    >
      <div className="flex items-center gap-2.5">
        <Avatar size="sm">
          <AvatarFallback>{initialsFromName(card.displayName)}</AvatarFallback>
        </Avatar>
        <span className="truncate text-sm font-medium text-muted-foreground">
          {card.displayName}
        </span>
      </div>

      <p className="text-lg font-semibold leading-snug tracking-[-0.04em] text-foreground">
        {sentence}
      </p>

      <div className="flex min-w-0 items-center gap-2">
        {card.origin === 'ARENA' ? (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            no Arena
          </span>
        ) : null}
        <span className="truncate text-xs font-medium text-muted-foreground">
          {card.group.name}
        </span>
      </div>
    </Link>
  );
}

function WeeklyHighlightsSkeleton() {
  return (
    <section
      className="space-y-3"
      aria-label="Carregando destaques da semana"
      aria-busy="true"
    >
      <div className="flex items-center gap-3 px-1">
        <div className="h-4 w-4 animate-pulse rounded-full bg-muted" />
        <div className="h-4 w-28 animate-pulse rounded-full bg-muted" />
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
    'flex w-[15.5rem] shrink-0 snap-start flex-col justify-between gap-3 rounded-[1.75rem] border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
    isFeatured
      ? 'border-primary/20 bg-gradient-to-br from-primary/15 via-card to-card shadow-md'
      : 'border-border bg-card/80 hover:bg-card',
  );
}
