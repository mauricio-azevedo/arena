import { cn } from '@/lib/utils';
import { Label, Meta } from '@/components/ui/text';
import { GroupAvatar } from '@/components/ui/group-avatar';

// The "de qual grupo / que convite é esse" chip at the top of every invite screen.
export function GroupBrandChip({
  groupName,
  title = 'Convite',
}: {
  groupName: string;
  title?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <GroupAvatar name={groupName} size="sm" tone="brand" />
      <div className="flex min-w-0 flex-col">
        <Label className="truncate text-foreground">{title}</Label>
        <Meta className="truncate text-faint-foreground">{groupName}</Meta>
      </div>
    </div>
  );
}

// A guest's faceless, dashed avatar — the profile has no account yet.
export function DashedAvatar({ initial, className }: { initial: string; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'flex items-center justify-center rounded-full border-2 border-dashed border-border-accent font-display text-muted-foreground',
        className,
      )}
    >
      {initial}
    </div>
  );
}
