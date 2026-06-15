import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getGroupInitials } from '@/features/groups/helpers/group-initials.helper';
import type { ProfileSummaryGroup } from '../types/profile-summary-group.type';
import { formatProfileRelativeDate } from '../../../helpers/profile-date-format.helper';

type Props = {
  groups: ProfileSummaryGroup[];
  onViewAll: () => void;
};

export function RecentGroupsSection({ groups, onViewAll }: Props) {
  return (
    <Card className="bg-gradient-to-br from-card via-card to-primary/8">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-[-0.035em]">Grupos recentes</h2>

          {groups.length > 0 && (
            <button
              type="button"
              onClick={onViewAll}
              className="rounded-full px-2 py-1 text-sm font-semibold text-muted-foreground transition-colors hover:bg-white/45 hover:text-foreground dark:hover:bg-white/10"
            >
              Ver todos
            </button>
          )}
        </div>

        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum grupo ainda.</p>
        ) : (
          <div className="space-y-2">
            {groups.map((group) => (
              <RecentGroupRow key={group.id} group={group} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentGroupRow({ group }: { group: ProfileSummaryGroup }) {
  return (
    <Link
      href={`/groups/${group.id}`}
      className="block rounded-[1.5rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <div className="br-pressable flex items-center gap-3 rounded-[1.5rem] bg-white/42 p-3 ring-1 ring-border/50 backdrop-blur-xl dark:bg-white/8">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.25rem] bg-muted text-sm font-semibold text-foreground">
          {getGroupInitials(group.name)}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold tracking-[-0.015em]">{group.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {Math.round(group.rating)} rating · {group.role === 'ADMIN' ? 'Admin' : 'Membro'} ·{' '}
            {formatProfileRelativeDate(group.lastPlayedAt)}
          </p>
        </div>

        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
    </Link>
  );
}
