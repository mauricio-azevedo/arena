import { Card, CardContent } from '@/components/ui/card';

export function ProfileLoadingState() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-6">
      <span className="sr-only">Carregando perfil</span>

      <Card className="bg-gradient-to-br from-card via-card to-primary/10">
        <CardContent className="space-y-5 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="h-14 w-14 shrink-0 animate-pulse rounded-[1.45rem] bg-muted" />
            <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-muted/80" />
          </div>

          <div className="space-y-2">
            <div className="h-6 w-3/4 animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded-full bg-muted/70" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="h-14 animate-pulse rounded-[1.2rem] bg-muted/80" />
            <div className="h-14 animate-pulse rounded-[1.2rem] bg-muted/70" />
            <div className="h-14 animate-pulse rounded-[1.2rem] bg-muted/60" />
          </div>
        </CardContent>
      </Card>

      <div className="br-liquid-glass br-hairline grid grid-cols-3 rounded-[1.85rem] p-1.5">
        <div className="h-12 animate-pulse rounded-[1.45rem] bg-muted" />
        <div className="h-12 animate-pulse rounded-[1.45rem] bg-muted/70" />
        <div className="h-12 animate-pulse rounded-[1.45rem] bg-muted/70" />
      </div>

      <ProfileSectionSkeleton />
      <ProfileSectionSkeleton />
    </div>
  );
}

function ProfileSectionSkeleton() {
  return (
    <Card className="bg-gradient-to-br from-card via-card to-primary/8">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="h-6 w-36 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-16 animate-pulse rounded-full bg-muted/70" />
        </div>

        <div className="rounded-[1.5rem] bg-white/42 p-3 ring-1 ring-border/50 backdrop-blur-xl dark:bg-white/8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-4/5 animate-pulse rounded-full bg-muted" />
              <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted/70" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
