import type { IngestionStatus, IngestionStage } from '@repo/types';
import type { IngestionJobView } from '../types/ingestion.types';

export type { IngestionJobView };

export abstract class IIngestionJobRepository {
  abstract create(data: {
    userId: string;
    documentId: string;
    status?: IngestionStatus;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
  abstract updateStage(
    documentId: string,
    stage: IngestionStage,
    status: IngestionStatus,
    userId?: string,
  ): Promise<void>;
  abstract markFailed(documentId: string, error: string): Promise<void>;
  abstract findByDocumentId(
    documentId: string,
  ): Promise<IngestionJobView | null>;
}
