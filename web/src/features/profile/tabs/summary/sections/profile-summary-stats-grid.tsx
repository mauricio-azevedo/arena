import type { ReactNode } from 'react';
import { CircleDot, Percent, Trophy, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { ProfileSummaryStats } from '../types/profile-summary-stats.type';

type Props = {
  stats: ProfileSummaryStats;
};

export function ProfileSummaryStatsGrid({ stats }: Props) {
  return (
    <section className="grid grid-cols-2 gap-2.5">
      <StatCard
        icon={<CircleDot className="h-3.5 w-3.5" />}
        value={stats.matchesPlayed}
        label="Partidas"
      />
      <StatCard icon={<Trophy className="h-3.5 w-3.5" />} value={stats.wins} label="Vitórias" />
      <StatCard icon={<X className="h-3.5 w-3.5" />} value={stats.losses} label="Derrotas" />
      <StatCard
        icon={<Percent className="h-3.5 w-3.5" />}
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
  icon: ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <Card size="sm" className="rounded-[1.6rem]">
      <CardContent className="flex min-h-[5rem] items-center gap-2.5 px-3 py-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[1.15rem] bg-primary/12 text-primary ring-1 ring-primary/10">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[1.375rem] font-semibold leading-none tracking-[-0.055em] text-foreground">
            {value}
          </p>
          <p className="mt-1.5 whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
