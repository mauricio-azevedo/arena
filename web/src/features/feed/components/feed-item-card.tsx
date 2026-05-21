import Link from 'next/link';
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
    <Card className="transition active:scale-[0.99]">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-sm font-semibold">
            {getGroupInitials(title)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link
                href={getFeedItemHref(item)}
                className="truncate text-sm font-medium underline-offset-4 hover:underline"
              >
                {title}
              </Link>
              <p className="shrink-0 text-xs text-muted-foreground">
                {formatFeedItemTime(item.occurredAt)}
              </p>
            </div>

            <p className="mt-1 text-sm leading-5">
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
