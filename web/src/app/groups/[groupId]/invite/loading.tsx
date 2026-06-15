import { AppShell } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';

export default function GroupInviteLoading() {
  return (
    <AppShell chrome={{ title: 'Convidar pessoas', back: { fallbackHref: '/' } }}>
      <div role="status" aria-live="polite" aria-busy="true" className="space-y-6">
        <span className="sr-only">Carregando convite</span>

        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-full animate-pulse rounded-full bg-muted/80" />
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-muted/70" />
        </div>

        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="h-12 animate-pulse rounded-2xl bg-muted" />
            <div className="h-10 animate-pulse rounded-2xl bg-muted/75" />
            <div className="h-10 animate-pulse rounded-2xl bg-muted/60" />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
