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
        label="partidas"
      />
      <StatCard icon={<Trophy className="h-5 w-5" />} value={stats.wins} label="vitórias" />
      <StatCard icon={<X className="h-5 w-5" />} value={stats.losses} label="derrotas" />
      <StatCard
        icon={<Percent className="h-5 w-5" />}
        value={`${stats.winRate}%`}
        label="aproveitamento"
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
    <Card className="rounded-2xl">
      <CardContent className="space-y-4 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>

        <div>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
