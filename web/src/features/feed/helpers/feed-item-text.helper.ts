import type { FeedItem } from '../types/feed-item.type';
import type { GroupCreatedFeedMetadata } from '../types/group-created-feed-metadata.type';

export function getFeedItemText(item: FeedItem) {
  if (item.type === 'GROUP_CREATED') {
    const metadata = item.metadata as GroupCreatedFeedMetadata;

    return `${getActorName(item)} criou o grupo ${metadata.groupName ?? item.group.name}.`;
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
