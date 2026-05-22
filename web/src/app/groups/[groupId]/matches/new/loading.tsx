import { AppShell } from '@/components/app-shell';
import { BackButton } from '@/components/back-button';
import { Card, CardContent } from '@/components/ui/card';

export default function NewGroupMatchLoading() {
  return (
    <AppShell>
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className="space-y-6"
      >
        <span className="sr-only">Carregando formulário de partida</span>

        <BackButton href="/groups" />

        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded-full bg-muted/70" />
        </div>

        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <TeamFormSkeleton />
              <div className="h-5 w-5 animate-pulse rounded-full bg-muted" />
              <TeamFormSkeleton />
            </div>

            <div className="h-4 w-64 max-w-full animate-pulse rounded-full bg-muted/70 mx-auto" />
            <div className="h-12 animate-pulse rounded-2xl bg-muted" />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function TeamFormSkeleton() {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="h-12 animate-pulse rounded-2xl bg-muted" />
        <div className="h-12 animate-pulse rounded-2xl bg-muted/75" />
      </div>
      <div className="h-14 animate-pulse rounded-2xl bg-muted/80" />
    </div>
  );
}
