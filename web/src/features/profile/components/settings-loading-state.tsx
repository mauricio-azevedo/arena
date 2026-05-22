import { Card, CardContent } from '@/components/ui/card';

export function SettingsLoadingState() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-6">
      <span className="sr-only">Carregando configurações</span>

      <header className="space-y-3">
        <div className="h-5 w-28 animate-pulse rounded-full bg-muted" />
        <div className="space-y-3">
          <div className="h-3 w-16 animate-pulse rounded-full bg-primary/20" />
          <div className="h-9 w-52 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded-full bg-muted/70" />
        </div>
      </header>

      <Card className="border-primary/15 bg-card/95 shadow-[0_18px_55px_rgba(84,54,20,0.12)]">
        <CardContent className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="h-4 w-14 animate-pulse rounded-full bg-muted" />
              <div className="h-11 animate-pulse rounded-xl bg-muted/80" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-20 animate-pulse rounded-full bg-muted" />
              <div className="h-11 animate-pulse rounded-xl bg-muted/80" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-4 w-16 animate-pulse rounded-full bg-muted" />
            <div className="h-11 animate-pulse rounded-xl bg-muted/80" />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="h-10 animate-pulse rounded-xl bg-muted/80" />
            <div className="h-10 animate-pulse rounded-xl bg-primary/20" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
