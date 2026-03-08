import type { IngestionStatus } from '@repo/types';

export interface IngestionJobView {
  documentId: string;
  userId: string;
  status: IngestionStatus;
  error: string | undefined;
  progress: number;
  metadata: Record<string, unknown>;
}
