import Link from 'next/link';
import { CircleDot, Flame, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { FeedItem } from '../types/feed-item.type';
import type { GroupCreatedFeedMetadata } from '../types/group-created-feed-metadata.type';
import type { MemberJoinedFeedMetadata } from '../types/member-joined-feed-metadata.type';
import type { DominantWinFeedMetadata } from '../types/dominant-win-feed-metadata.type';
import type { CloseMatchFeedMetadata } from '../types/close-match-feed-metadata.type';
import { getGroupInitials } from '../helpers/feed-item-style.helper';
import { formatFeedItemTime } from '../helpers/feed-item-time.helper';
import { getFeedItemHref } from '@/features/feed/helpers/feed-item-link.helper';
import { UserNameLink } from '@/features/users/components/user-name-link';
import { RankingMovementFeedCard } from './ranking-movement-feed-card';

type Props = {
  item: FeedItem;
  context?: 'global' | 'group';
};

type FeedPlayer = {
  groupMemberId: string;
  userId: string;
  displayName: string;
};

export function FeedItemCard({ item, context = 'global' }: Props) {
  if (item.type === 'MATCH_BLOWOUT') {
    return <DominantWinFeedCard item={item} context={context} />;
  }

  if (item.type === 'MATCH_CLOSE') {
    return <CloseMatchFeedCard item={item} context={context} />;
  }

  if (item.type === 'RANKING_MOVEMENT') {
    return <RankingMovementFeedCard item={item} />;
  }

  const title = item.group?.name ?? 'Arena';

  return (
    <Card className="br-pressable">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
            {getGroupInitials(title)}
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-card text-muted-foreground shadow-[0_4px_12px_color-mix(in_oklch,var(--foreground)_6%,transparent)]">
              <Sparkles className="h-3 w-3" />
            </span>
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <FeedItemTitle item={item}>{title}</FeedItemTitle>
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

function DominantWinFeedCard({ item, context }: { item: FeedItem; context: 'global' | 'group' }) {
  const metadata = item.metadata as DominantWinFeedMetadata;
  const winnerScore = Math.max(metadata.gamesA, metadata.gamesB);
  const loserScore = Math.min(metadata.gamesA, metadata.gamesB);

  return (
    <Card className="br-pressable">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
            <Flame className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-foreground">Atropelo</p>
              <p className="shrink-0 text-xs text-muted-foreground">
                {formatFeedItemTime(item.occurredAt)}
              </p>
            </div>

            <p className="text-sm leading-6 text-muted-foreground">
              <FeedPlayerNames players={metadata.winners} /> venceram{' '}
              <FeedPlayerNames players={metadata.losers} /> por{' '}
              <span className="font-semibold text-foreground">
                {winnerScore}–{loserScore}
              </span>
              <FeedGroupSuffix item={item} context={context} />
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CloseMatchFeedCard({ item, context }: { item: FeedItem; context: 'global' | 'group' }) {
  const metadata = item.metadata as CloseMatchFeedMetadata;
  const winnerScore = Math.max(metadata.gamesA, metadata.gamesB);
  const loserScore = Math.min(metadata.gamesA, metadata.gamesB);

  return (
    <Card className="br-pressable">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
            <CircleDot className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-foreground">No detalhe</p>
              <p className="shrink-0 text-xs text-muted-foreground">
                {formatFeedItemTime(item.occurredAt)}
              </p>
            </div>

            <p className="text-sm leading-6 text-muted-foreground">
              <FeedPlayerNames players={metadata.winners} /> venceram{' '}
              <FeedPlayerNames players={metadata.losers} /> no detalhe por{' '}
              <span className="font-semibold text-foreground">
                {winnerScore}–{loserScore}
              </span>
              <FeedGroupSuffix item={item} context={context} />
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FeedItemTitle({ item, children }: { item: FeedItem; children: string }) {
  return (
    <Link
      href={getFeedItemHref(item)}
      className="truncate text-sm font-medium text-foreground underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  );
}

function FeedItemText({ item }: { item: FeedItem }) {
  if (item.type === 'GROUP_CREATED') {
    const metadata = item.metadata as GroupCreatedFeedMetadata;

    return (
      <>
        <FeedActorName item={item} /> criou o grupo{' '}
        <FeedGroupLink item={item}>
          {metadata.groupName ?? item.group?.name ?? 'um grupo'}
        </FeedGroupLink>
        .
      </>
    );
  }

  if (item.type === 'MEMBER_JOINED') {
    const metadata = item.metadata as MemberJoinedFeedMetadata;

    if (item.isActorCurrentUser) {
      return (
        <>
          <UserNameLink userId={item.actorUserId} variant="feed">
            Você
          </UserNameLink>{' '}
          entrou no grupo{' '}
          <FeedGroupLink item={item}>{item.group?.name ?? 'um grupo'}</FeedGroupLink>.
        </>
      );
    }

    return (
      <>
        <UserNameLink userId={item.subjectUserId ?? item.actorUserId} variant="feed">
          {metadata.displayName ?? getActorName(item)}
        </UserNameLink>{' '}
        entrou no grupo <FeedGroupLink item={item}>{item.group?.name ?? 'um grupo'}</FeedGroupLink>.
      </>
    );
  }

  return <>Novo momento no grupo.</>;
}

function FeedPlayerNames({ players }: { players: FeedPlayer[] }) {
  return (
    <>
      {players.map((player, index) => (
        <span key={player.groupMemberId}>
          {index > 0 && ' e '}
          <UserNameLink userId={player.userId} variant="feed">
            {player.displayName}
          </UserNameLink>
        </span>
      ))}
    </>
  );
}

function FeedGroupSuffix({ item, context }: { item: FeedItem; context: 'global' | 'group' }) {
  if (context === 'group') {
    return <>.</>;
  }

  if (!item.group?.name) {
    return <>.</>;
  }

  return (
    <>
      {' '}
      no <FeedGroupLink item={item}>{item.group.name}</FeedGroupLink>.
    </>
  );
}

function FeedGroupLink({ item, children }: { item: FeedItem; children: string }) {
  if (!item.group?.id) {
    return <span className="font-medium text-foreground">{children}</span>;
  }

  return (
    <Link
      href={`/groups/${item.group.id}`}
      className="font-medium text-foreground underline decoration-primary/30 underline-offset-[3px] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </Link>
  );
}

function FeedActorName({ item }: { item: FeedItem }) {
  if (item.isActorCurrentUser) {
    return (
      <UserNameLink userId={item.actorUserId} variant="feed">
        Você
      </UserNameLink>
    );
  }

  return (
    <UserNameLink userId={item.actorUserId} variant="feed">
      {getActorName(item)}
    </UserNameLink>
  );
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
