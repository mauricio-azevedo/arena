import type { ReactNode } from 'react';
import { CircleDot, Percent, Trophy, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TypographyLarge, TypographyMuted } from '@/components/ui/typography';
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
    <Card size="sm">
      <CardContent className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center">
          {icon}
        </div>

        <div className="min-w-0">
          <TypographyLarge>{value}</TypographyLarge>
          <TypographyMuted>{label}</TypographyMuted>
        </div>
      </CardContent>
    </Card>
  );
}
