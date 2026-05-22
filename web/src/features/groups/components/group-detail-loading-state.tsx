import { Card, CardContent } from '@/components/ui/card';

export function GroupDetailLoadingState() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="space-y-6"
    >
      <span className="sr-only">Carregando grupo</span>

      <div className="space-y-4">
        <div className="space-y-2 rounded-3xl border bg-card/70 p-4 shadow-[0_14px_45px_rgba(84,54,20,0.08)] backdrop-blur-sm">
          <div className="h-7 w-2/3 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-full animate-pulse rounded-full bg-muted/80" />
          <div className="h-3 w-1/2 animate-pulse rounded-full bg-muted/70" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="h-11 animate-pulse rounded-2xl bg-muted" />
          <div className="h-11 animate-pulse rounded-2xl bg-muted/70" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 rounded-[1.65rem] border bg-card/70 p-1.5 shadow-sm backdrop-blur-sm">
        <div className="h-10 animate-pulse rounded-[1.25rem] bg-primary/18" />
        <div className="h-10 animate-pulse rounded-[1.25rem] bg-muted/70" />
        <div className="h-10 animate-pulse rounded-[1.25rem] bg-muted/70" />
      </div>

      <section className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-2xl bg-muted" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-2/3 animate-pulse rounded-full bg-muted" />
                  <div className="h-3 w-1/3 animate-pulse rounded-full bg-muted/70" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="ml-auto h-5 w-12 animate-pulse rounded-full bg-muted" />
                <div className="h-3 w-10 animate-pulse rounded-full bg-muted/70" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
