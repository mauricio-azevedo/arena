export type ProcessingJobType =
  | 'MATCH_CREATED'
  | 'MATCH_UPDATED'
  | 'MATCH_DELETED'
  | 'GROUP_RANKING_REBUILD';

export type ProcessingJobScope = 'GROUP' | 'PLATFORM';

export type ProcessingJobStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';

export type ProcessingJob = {
  id: string;
  type: ProcessingJobType;
  scope: ProcessingJobScope;
  status: ProcessingJobStatus;
  groupId: string;
  matchId: string | null;
  dedupeKey: string | null;
  payload: Record<string, unknown>;
  attemptCount: number;
  maxAttempts: number;
  availableAt: Date;
  lockedAt: Date | null;
  lockedBy: string | null;
  lastError: string | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
