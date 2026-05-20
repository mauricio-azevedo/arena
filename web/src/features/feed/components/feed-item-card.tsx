import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import type { FeedItem } from '../types/feed-item.type';
import { getFeedItemText } from '../helpers/feed-item-text.helper';
import { getGroupInitials } from '../helpers/feed-item-style.helper';
import { formatFeedItemTime } from '../helpers/feed-item-time.helper';

type Props = {
  item: FeedItem;
};

export function FeedItemCard({ item }: Props) {
  return (
    <Link href={`/groups/${item.group.id}`} className="block">
      <Card className="transition active:scale-[0.99]">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-sm font-semibold">
              {getGroupInitials(item.group.name)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{item.group.name}</p>
                <p className="shrink-0 text-xs text-muted-foreground">
                  {formatFeedItemTime(item.occurredAt)}
                </p>
              </div>

              <p className="mt-1 text-sm leading-5">{getFeedItemText(item)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
