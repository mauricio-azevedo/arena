import { Card, CardContent } from '@/components/ui/card';

export function ProfileLoadingState() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="space-y-6"
    >
      <span className="sr-only">Carregando perfil</span>

      <div className="rounded-[2rem] border bg-gradient-to-br from-primary/75 via-primary/70 to-amber-500/80 p-5 shadow-[0_18px_60px_rgba(84,54,20,0.16)]">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 animate-pulse rounded-[1.6rem] bg-white/22 ring-1 ring-white/25" />

          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-3 w-24 animate-pulse rounded-full bg-white/35" />
            <div className="h-7 w-4/5 animate-pulse rounded-full bg-white/45" />
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-white/30" />
          </div>

          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-white/18" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 rounded-[1.65rem] border bg-card/70 p-1.5 shadow-sm backdrop-blur-sm">
        <div className="h-10 animate-pulse rounded-[1.25rem] bg-primary/18" />
        <div className="h-10 animate-pulse rounded-[1.25rem] bg-muted/70" />
        <div className="h-10 animate-pulse rounded-[1.25rem] bg-muted/70" />
        <div className="h-10 animate-pulse rounded-[1.25rem] bg-muted/70" />
      </div>

      <section className="grid grid-cols-2 gap-2.5">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} size="sm" className="rounded-[1.6rem]">
            <CardContent className="flex min-h-[5rem] items-center gap-2.5 px-3 py-2.5">
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-[1.15rem] bg-muted" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-5 w-10 animate-pulse rounded-full bg-muted" />
                <div className="h-2.5 w-20 animate-pulse rounded-full bg-muted/70" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <ProfileSectionSkeleton />
      <ProfileSectionSkeleton />
    </div>
  );
}

function ProfileSectionSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="h-6 w-36 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-16 animate-pulse rounded-full bg-muted/70" />
        </div>

        <div className="flex items-center gap-3">
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-2xl bg-muted" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-4/5 animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted/70" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
