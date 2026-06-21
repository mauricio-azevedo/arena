'use client';

import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TypographySmall } from '@/components/ui/typography';
import { useSafeNavigation, type BackBehavior } from '@/providers/navigation-provider';

export type AppTopBarBack = {
  fallbackHref: string;
  label?: string;
  behavior?: BackBehavior;
};

type AppTopBarProps = {
  title?: string;
  back?: AppTopBarBack;
  trailing?: ReactNode;
};

export function AppTopBar({ title, back, trailing }: AppTopBarProps) {
  const { safeBack } = useSafeNavigation();

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pb-3 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <div className="pointer-events-none absolute inset-0 bg-background/40 backdrop-blur-xs" />

      <div className="relative mx-auto grid h-11 w-full max-w-md grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center">
        <div className="min-w-0 justify-self-start">
          {back && (
            <Button
              type="button"
              onClick={() => safeBack(back.fallbackHref, { behavior: back.behavior })}
              variant="secondary"
              size="icon"
              aria-label={back.label ?? 'Voltar'}
            >
              <ArrowLeft />
            </Button>
          )}
        </div>

        {title ? <TypographySmall className="truncate">{title}</TypographySmall> : <span aria-hidden="true" />}

        <div className="min-w-0 justify-self-end">{trailing}</div>
      </div>
    </header>
  );
}
