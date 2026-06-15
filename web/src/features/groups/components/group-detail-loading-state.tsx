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

      <Card className="bg-gradient-to-br from-card via-card to-primary/10">
        <CardContent className="space-y-5 p-5">
          <div className="space-y-3">
            <div className="h-3 w-32 animate-pulse rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-8 w-3/4 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded-full bg-muted/70" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="h-28 animate-pulse rounded-[1.5rem] bg-muted/80" />
            <div className="h-28 animate-pulse rounded-[1.5rem] bg-muted/70" />
          </div>

          <div className="h-16 animate-pulse rounded-[1.5rem] bg-muted/70" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <div className="h-12 animate-pulse rounded-full bg-muted" />
        <div className="h-12 animate-pulse rounded-full bg-muted/70" />
      </div>

      <div className="grid grid-cols-3 gap-1.5 rounded-[1.85rem] border bg-card/70 p-1.5 shadow-sm backdrop-blur-sm">
        <div className="h-12 animate-pulse rounded-[1.45rem] bg-primary/18" />
        <div className="h-12 animate-pulse rounded-[1.45rem] bg-muted/70" />
        <div className="h-12 animate-pulse rounded-[1.45rem] bg-muted/70" />
      </div>

      <section className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="h-11 w-11 shrink-0 animate-pulse rounded-[1.35rem] bg-muted" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-2/3 animate-pulse rounded-full bg-muted" />
                  <div className="h-3 w-1/3 animate-pulse rounded-full bg-muted/70" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="ml-auto h-6 w-14 animate-pulse rounded-full bg-muted" />
                <div className="h-3 w-10 animate-pulse rounded-full bg-muted/70" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
