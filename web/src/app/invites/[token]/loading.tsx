import { AppShell } from '@/components/app-shell';
import { BackButton } from '@/components/back-button';
import { Card, CardContent } from '@/components/ui/card';

export default function InviteLoading() {
  return (
    <AppShell>
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className="space-y-6"
      >
        <span className="sr-only">Carregando convite</span>

        <BackButton href="/groups" label="Grupos" />

        <div className="space-y-2">
          <div className="h-8 w-52 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-full animate-pulse rounded-full bg-muted/80" />
          <div className="h-4 w-3/4 animate-pulse rounded-full bg-muted/70" />
        </div>

        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="h-5 w-32 animate-pulse rounded-full bg-muted" />
            <div className="h-12 animate-pulse rounded-2xl bg-muted/80" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-11 animate-pulse rounded-2xl bg-muted" />
              <div className="h-11 animate-pulse rounded-2xl bg-muted/70" />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
