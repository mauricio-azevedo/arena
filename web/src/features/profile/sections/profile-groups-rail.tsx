import Link from 'next/link';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Heading, Label, Meta, Stat } from '@/components/ui/text';
import { getGroupInitials } from '@/features/groups/helpers/group-initials.helper';
import { hueFromId } from '@/features/weekly-highlights/helpers/highlight-style';
import type { ProfileSummaryGroup } from '../types/profile-summary-group.type';
import { ProfileMonogram } from './profile-monogram';

export function ProfileGroupsRail({ groups }: { groups: ProfileSummaryGroup[] }) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3.5">
      <div className="flex items-center justify-between px-1">
        <Heading>Seus grupos</Heading>
        <Meta className="text-muted-foreground">{groups.length}</Meta>
      </div>

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pt-2 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {groups.map((group) => (
          <GroupRailCard key={group.id} group={group} />
        ))}
      </div>
    </section>
  );
}

function GroupRailCard({ group }: { group: ProfileSummaryGroup }) {
  const hue = hueFromId(group.id);

  return (
    <Link
      href={`/groups/${group.id}`}
      className="flex w-[9.875rem] shrink-0 flex-col rounded-card bg-surface p-4 shadow-card transition-transform active:scale-[0.98]"
    >
      <div className="flex items-center justify-between">
        <ProfileMonogram
          className="size-[2.875rem] rounded-[0.875rem] text-stat-sm"
          style={{
            background: `linear-gradient(150deg, oklch(60% 0.13 ${hue}), oklch(50% 0.13 ${hue}))`,
            boxShadow: 'inset 0 0 0 1px var(--border-accent)',
          }}
        >
          {getGroupInitials(group.name)}
        </ProfileMonogram>
        <RankTrend rankDelta={group.rankDelta} />
      </div>

      <Label className="mt-3.5 truncate font-bold">{group.name}</Label>
      {group.description && (
        <Meta className="truncate text-faint-foreground">{group.description}</Meta>
      )}

      <div className="mt-3.5 flex items-baseline gap-1.5">
        <Stat size="lg" className="font-extrabold">
          {group.currentRank != null ? `#${group.currentRank}` : '—'}
        </Stat>
        <Meta className="text-faint-foreground">de {group.membersCount ?? 0}</Meta>
      </div>
    </Link>
  );
}

function RankTrend({ rankDelta }: { rankDelta: number | null }) {
  if (rankDelta == null || rankDelta === 0) {
    return <Meta className="text-faint-foreground">–</Meta>;
  }

  const up = rankDelta > 0;
  const Icon = up ? ArrowUp : ArrowDown;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 font-display text-meta font-extrabold tabular-nums',
        up ? 'text-success' : 'text-danger',
      )}
    >
      <Icon className="size-3" strokeWidth={3} aria-hidden />
      {Math.abs(rankDelta)}
    </span>
  );
}
