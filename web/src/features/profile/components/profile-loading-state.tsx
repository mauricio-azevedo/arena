import { Card, CardContent } from '@/components/ui/card';

export function ProfileLoadingState() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-6">
      <span className="sr-only">Carregando perfil</span>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-muted" />

            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
              <div className="h-6 w-4/5 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-1 rounded-2xl border bg-card p-1 shadow-sm">
        <div className="h-11 animate-pulse rounded-xl bg-muted" />
        <div className="h-11 animate-pulse rounded-xl bg-muted" />
        <div className="h-11 animate-pulse rounded-xl bg-muted" />
        <div className="h-11 animate-pulse rounded-xl bg-muted" />
      </div>

      <section className="grid grid-cols-2 gap-2.5">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} size="sm">
            <CardContent className="flex min-h-[5rem] items-center gap-2.5 px-3 py-2.5">
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-muted" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-5 w-10 animate-pulse rounded-full bg-muted" />
                <div className="h-2.5 w-20 animate-pulse rounded-full bg-muted" />
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
          <div className="h-4 w-16 animate-pulse rounded-full bg-muted" />
        </div>

        <div className="flex items-center gap-3">
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-muted" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-4/5 animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
