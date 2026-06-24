import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Heading, Label, Meta, Stat } from '@/components/ui/text';
import { recentFormChip } from '../helpers/recent-form.helper';
import type { ProfileSummaryStats } from '../types/profile-summary-stats.type';

export function ProfilePerformance({ stats }: { stats: ProfileSummaryStats }) {
  const { wins, losses, matchesPlayed, winRate } = stats;
  // Tolerate an older/partial API response that predates recentForm.
  const recentForm = stats.recentForm ?? [];
  const hasMatches = matchesPlayed > 0;

  return (
    <section className="space-y-3.5">
      <Heading className="px-1">Desempenho</Heading>
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <Stat size="sm" className="text-success">
                {wins}
              </Stat>
              <Meta className="text-muted-foreground">vitórias</Meta>
            </div>
            <div className="flex items-baseline gap-1.5">
              <Meta className="text-muted-foreground">derrotas</Meta>
              <Stat size="sm" className="text-danger">
                {losses}
              </Stat>
            </div>
          </div>

          {hasMatches ? (
            <div className="h-3.5 overflow-hidden rounded-full bg-danger">
              <div className="h-full rounded-full bg-success" style={{ width: `${winRate}%` }} />
            </div>
          ) : (
            <div className="h-3.5 rounded-full bg-muted" />
          )}

          <Meta className="block text-center text-muted-foreground">
            <span className="font-bold text-foreground">{matchesPlayed}</span> partidas ·{' '}
            <span className="font-bold text-brand">{winRate}%</span> aproveitamento
          </Meta>

          {recentForm.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label className="font-bold">Forma recente</Label>
                <Meta className="text-faint-foreground">últimas {recentForm.length}</Meta>
              </div>
              <div className="flex gap-1.5">
                {recentForm.map((result, index) => {
                  const chip = recentFormChip(result);
                  return (
                    <div
                      key={index}
                      className={cn(
                        'flex h-8 flex-1 items-center justify-center rounded-[0.625rem] font-display text-meta font-extrabold',
                        chip.className,
                      )}
                    >
                      {chip.label}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
