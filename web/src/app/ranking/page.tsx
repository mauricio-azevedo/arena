import { getRanking } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';

export default async function RankingPage() {
  const ranking = await getRanking();

  return (
    <AppShell>
      <PageHeader title="Ranking" />

      <section className="mt-6 space-y-2">
        {ranking.map((player, index) => (
          <Card key={player.id} className="overflow-hidden">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-8 text-center text-sm font-semibold text-muted-foreground">
                {index + 1}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{player.name}</p>
              </div>

              <div className="text-right">
                <p className="text-xl font-semibold tracking-tight">{player.rating.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">rating</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </AppShell>
  );
}
