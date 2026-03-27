import type {
  DocumentStatus,
  DocumentType,
  IngestionStatus,
  PaginatedResponse,
  SourceType,
} from '@repo/types';

export interface DocumentFilters {
  folderIds?: string[];
  limit?: number;
  page?: number;
  q?: string;
  status?: DocumentStatus;
  type?: DocumentType;
  unassigned?: boolean;
}

export interface DocumentRow {
  createdAt: string;
  folderId?: string;
  id: string;
  lastOpenedAt?: string;
  sourceType: SourceType;
  sourceUrl?: string;
  status: DocumentStatus;
  tags: string[];
  title: string;
  type: DocumentType;
  updatedAt: string;
  userId: string;
}

export interface DocumentDetail extends DocumentRow {
  content?: string;
  metadata: Record<string, unknown>;
  summary?: string;
}

export interface IngestionStatusView {
  currentStage?: string;
  embeddingsReady: boolean;
  ingestionError?: string;
  ingestionStatus?: IngestionStatus;
}

export interface FolderRow {
  color?: string;
  createdAt: string;
  description?: string;
  id: string;
  name: string;
  parentId?: string | null;
  updatedAt?: string;
  userId: string;
}

export interface FolderDetails {
  documentCount: number;
  folder: FolderRow;
}

export interface NoteRow {
  content: string;
  createdAt: string;
  documentId: string;
  id: string;
}

export type DocumentsListData = PaginatedResponse<DocumentRow>;
