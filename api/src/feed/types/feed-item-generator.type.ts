import type { FeedItemDraft } from './feed-item-draft.type';

export type FeedItemGenerator<Input> = {
  generate(input: Input): FeedItemDraft | null;
};
