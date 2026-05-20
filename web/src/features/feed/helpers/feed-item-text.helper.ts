import type { FeedItem } from '../types/feed-item.type';
import type { GroupCreatedFeedMetadata } from '../types/group-created-feed-metadata.type';
import { MemberJoinedFeedMetadata } from '@/features/feed/types/member-joined-feed-metadata.type';

export function getFeedItemText(item: FeedItem) {
  if (item.type === 'GROUP_CREATED') {
    const metadata = item.metadata as GroupCreatedFeedMetadata;

    return `${getActorName(item)} criou o grupo ${metadata.groupName ?? item.group.name}.`;
  }

  if (item.type === 'MEMBER_JOINED') {
    const metadata = item.metadata as MemberJoinedFeedMetadata;

    if (item.isActorCurrentUser) {
      return `Você entrou no grupo ${item.group.name}.`;
    }

    return `${metadata.displayName ?? getActorName(item)} entrou no grupo.`;
  }

  return 'Novo momento no grupo.';
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
