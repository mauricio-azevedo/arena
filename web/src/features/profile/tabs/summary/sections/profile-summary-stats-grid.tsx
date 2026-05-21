import { CircleDot, Percent, Trophy, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { ProfileSummaryStats } from '../types/profile-summary-stats.type';

type Props = {
  stats: ProfileSummaryStats;
};

export function ProfileSummaryStatsGrid({ stats }: Props) {
  return (
    <section className="grid grid-cols-2 gap-3">
      <StatCard
        icon={<CircleDot className="h-5 w-5" />}
        value={stats.matchesPlayed}
        label="Partidas"
      />
      <StatCard icon={<Trophy className="h-5 w-5" />} value={stats.wins} label="Vitórias" />
      <StatCard icon={<X className="h-5 w-5" />} value={stats.losses} label="Derrotas" />
      <StatCard
        icon={<Percent className="h-5 w-5" />}
        value={`${stats.winRate}%`}
        label="Aproveitamento"
      />
    </section>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          {icon}
        </div>

        <div>
          <p className="text-3xl font-semibold tracking-[-0.055em]">{value}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
