import { z } from 'zod';

// Which product moment a FeedItem records. Leaf file: the group home card
// embeds the group's last relevant item, and the feed module reuses it when it
// converts — a module importing another module for one enum invites a cycle.
export const feedItemTypeSchema = z.enum([
  'GROUP_CREATED',
  'MEMBER_JOINED',
  'MATCH_CLOSE',
  'MATCH_BLOWOUT',
  'UPSET_WIN',
  'RANKING_MOVEMENT',
]);

export type FeedItemType = z.infer<typeof feedItemTypeSchema>;
