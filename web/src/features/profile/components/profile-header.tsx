import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { ProfileSummaryStats } from '@/features/profile/tabs/summary/types/profile-summary-stats.type';
import type { ProfileUser } from '../types/profile-user.type';

type Props = {
  user: ProfileUser;
  stats: ProfileSummaryStats;
  isPublicProfile?: boolean;
  action?: ReactNode;
};

export function ProfileHeader({ user, stats, isPublicProfile = false, action }: Props) {
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const initials = getUserInitials(user);

  return (
    <Card className="bg-gradient-to-br from-card via-card to-primary/10">
      <CardContent className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <ProfileAvatar initials={initials} />
          {action && <div className="shrink-0">{action}</div>}
        </div>

        <div className="min-w-0 space-y-1">
          <h1 className="truncate text-xl font-semibold tracking-[-0.045em] text-foreground">
            {fullName || 'Jogador'}
          </h1>
          {!isPublicProfile && user.email ? (
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <ProfileMetric value={stats.matchesPlayed} label="partidas" />
          <ProfileMetric value={stats.wins} label="vitórias" />
          <ProfileMetric value={`${stats.winRate}%`} label="aprov." />
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileAvatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.45rem] bg-muted text-base font-semibold text-foreground">
      {initials || 'J'}
    </div>
  );
}

function ProfileMetric({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="min-w-0 rounded-[1.2rem] bg-white/42 px-3 py-2 text-center ring-1 ring-border/50 backdrop-blur-xl dark:bg-white/8">
      <p className="truncate text-lg font-semibold leading-none tracking-[-0.05em] text-foreground">
        {value}
      </p>
      <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function getUserInitials(user: ProfileUser) {
  return `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();
}
