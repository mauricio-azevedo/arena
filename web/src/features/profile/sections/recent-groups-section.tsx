import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { ProfileSummaryGroup } from '../types/profile-summary-group.type';
import { formatProfileRelativeDate } from '../helpers/profile-date-format.helper';

type Props = {
  groups: ProfileSummaryGroup[];
  onViewAll: () => void;
};

export function RecentGroupsSection({ groups, onViewAll }: Props) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Grupos recentes</h2>

          <button
            type="button"
            onClick={onViewAll}
            className="text-sm font-medium text-muted-foreground"
          >
            Ver todos
          </button>
        </div>

        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">Você ainda não jogou em nenhum grupo.</p>
        ) : (
          <div className="divide-y">
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
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-semibold">
        {getGroupInitials(group.name)}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{group.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          Rating {group.rating.toFixed(0)} · {group.role === 'ADMIN' ? 'Admin' : 'Membro'} ·{' '}
          {formatProfileRelativeDate(group.lastPlayedAt)}
        </p>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </div>
  );
}

function getGroupInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
