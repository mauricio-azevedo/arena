import Link from 'next/link';
import { ArrowUpToLine, Check, UserPlus, X, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label, Meta } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { formatFeedItemTime } from '@/features/feed/helpers/feed-item-time.helper';
import type { AppNotification, NotificationType } from '@/types/api';

type Visual = { Icon: LucideIcon; circle: string };

const TYPE_VISUAL: Record<NotificationType, Visual> = {
  CLAIM_REQUEST: { Icon: ArrowUpToLine, circle: 'bg-tag-warn/15 text-tag-warn' },
  CLAIM_APPROVED: { Icon: Check, circle: 'bg-success/15 text-success' },
  CLAIM_DECLINED: { Icon: X, circle: 'bg-surface text-muted-foreground' },
  CLAIM_INVITE: { Icon: UserPlus, circle: 'bg-brand/15 text-brand' },
};

export function NotificationCard({ notification }: { notification: AppNotification }) {
  const { Icon, circle } = TYPE_VISUAL[notification.type];
  const { title, body, meta, actions } = notification.data;
  const unread = !notification.read;

  const metaLine = [formatFeedItemTime(notification.createdAt), meta]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      className={cn(
        'relative rounded-3xl p-4',
        unread
          ? 'bg-brand/[0.08] shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--brand)_28%,transparent)]'
          : 'bg-surface shadow-hairline',
      )}
    >
      {unread && (
        <span className="absolute right-4 top-4 size-2.5 rounded-full bg-brand" aria-hidden />
      )}

      <div className="flex items-start gap-3">
        <span
          className={cn('flex size-11 shrink-0 items-center justify-center rounded-full', circle)}
          aria-hidden
        >
          <Icon className="size-5" strokeWidth={2.2} />
        </span>

        <div className="min-w-0 flex-1 pr-4">
          {title && <Label className="block text-foreground">{title}</Label>}
          {body && <Meta className="mt-1 block leading-relaxed text-muted-foreground">{body}</Meta>}
          {metaLine && <Meta className="mt-2 block text-faint-foreground">{metaLine}</Meta>}
        </div>
      </div>

      {actions && actions.length > 0 && (
        <div className="mt-3.5 flex gap-2">
          {actions.map((action, index) => (
            <Button
              key={action.href + action.label}
              asChild
              size="default"
              variant={index === 0 ? 'default' : 'secondary'}
              className={index === 0 ? 'flex-1' : ''}
            >
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
