import type {
  DocumentType,
  DocumentStatus,
  IngestionStatus,
} from '@repo/types';

export interface DocFilters {
  status?: DocumentStatus | undefined;
  type?: DocumentType | undefined;
  folderIds?: string[] | undefined;
  unassigned?: boolean | undefined;
  tagIds?: string[] | undefined;
  q?: string | undefined;
  page: number;
  limit: number;
}

export interface IngestionStatusView {
  ingestionStatus?: IngestionStatus | undefined;
  currentStage?: string | undefined;
  embeddingsReady: boolean;
  ingestionError?: string | undefined;
}
