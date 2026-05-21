import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { FeedItem } from '../types/feed-item.type';
import type { GroupCreatedFeedMetadata } from '../types/group-created-feed-metadata.type';
import type { MemberJoinedFeedMetadata } from '../types/member-joined-feed-metadata.type';
import { getGroupInitials } from '../helpers/feed-item-style.helper';
import { formatFeedItemTime } from '../helpers/feed-item-time.helper';
import { getFeedItemHref } from '@/features/feed/helpers/feed-item-link.helper';
import { UserNameLink } from '@/features/users/components/user-name-link';

type Props = {
  item: FeedItem;
};

export function FeedItemCard({ item }: Props) {
  const title = item.group?.name ?? 'BeachRank';

  return (
    <Card className="transition-transform active:scale-[0.99]">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/16 to-accent text-sm font-bold text-primary ring-1 ring-primary/10">
            {getGroupInitials(title)}
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="h-3 w-3" />
            </span>
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <Link
                href={getFeedItemHref(item)}
                className="truncate text-sm font-semibold tracking-[-0.01em] underline-offset-4 hover:underline"
              >
                {title}
              </Link>
              <p className="shrink-0 text-xs text-muted-foreground">
                {formatFeedItemTime(item.occurredAt)}
              </p>
            </div>

            <p className="text-sm leading-6 text-muted-foreground">
              <FeedItemText item={item} />
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FeedItemText({ item }: { item: FeedItem }) {
  if (item.type === 'GROUP_CREATED') {
    const metadata = item.metadata as GroupCreatedFeedMetadata;

    return (
      <>
        <FeedActorName item={item} /> criou o grupo{' '}
        {metadata.groupName ?? item.group?.name ?? 'um grupo'}.
      </>
    );
  }

  if (item.type === 'MEMBER_JOINED') {
    const metadata = item.metadata as MemberJoinedFeedMetadata;

    if (item.isActorCurrentUser) {
      return <>Você entrou no grupo {item.group?.name ?? 'um grupo'}.</>;
    }

    return (
      <>
        <UserNameLink userId={item.subjectUserId ?? item.actorUserId}>
          {metadata.displayName ?? getActorName(item)}
        </UserNameLink>{' '}
        entrou no grupo.
      </>
    );
  }

  return <>Novo momento no grupo.</>;
}

function FeedActorName({ item }: { item: FeedItem }) {
  if (item.isActorCurrentUser) {
    return <>Você</>;
  }

  return <UserNameLink userId={item.actorUserId}>{getActorName(item)}</UserNameLink>;
}

function getActorName(item: FeedItem) {
  if (item.isActorCurrentUser) {
    return 'Você';
  }

  if (!item.actorUser) {
    return 'Alguém';
  }

  return `${item.actorUser.firstName} ${item.actorUser.lastName}`.trim();
}
