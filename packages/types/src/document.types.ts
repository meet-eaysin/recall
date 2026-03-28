import type { IngestionStatus, IngestionStage } from './ingestion.types';

export enum DocumentType {
  URL = 'url',
  YOUTUBE = 'youtube',
  PDF = 'pdf',
  IMAGE = 'image',
  TEXT = 'text',
  DOCX = 'docx',
}

export enum DocumentStatus {
  TO_READ = 'to_read',
  TO_WATCH = 'to_watch',
  IN_PROCESS = 'in_process',
  REVIEW = 'review',
  UPCOMING = 'upcoming',
  COMPLETED = 'completed',
  PENDING_COMPLETION = 'pending_completion',
  ARCHIVED = 'archived',
}

export enum TranscriptStatus {
  IDLE = 'idle',
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  UNAVAILABLE = 'unavailable',
}

export enum SourceType {
  FILE = 'file',
  URL = 'url',
  NOTION = 'notion',
}

export interface DocFilters {
  status?: DocumentStatus | undefined;
  type?: DocumentType | undefined;
  folderIds?: string[] | undefined;
  tagIds?: string[] | undefined;
  q?: string | undefined;
  page: number;
  limit: number;
}

export interface IngestionStatusView {
  ingestionStatus?: IngestionStatus | undefined;
  currentStage?: IngestionStage | undefined;
  embeddingsReady: boolean;
  ingestionError?: string | undefined;
}

export interface DocumentPublicView {
  id: string;
  userId: string;
  folderId?: string | undefined;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  sourceType: SourceType;
  sourceUrl?: string | undefined;
  tags: string[];
  summary?: string | undefined;
  content?: string | undefined;
  lastOpenedAt?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
  transcriptStatus?: TranscriptStatus;
  transcriptError?: string;
}

export interface DocumentDetailView extends DocumentPublicView {
  content?: string | undefined;
  summary?: string | undefined;
  metadata: Record<string, unknown>;
}

export interface DocumentEntityProps {
  id: string;
  userId: string;
  folderId?: string | undefined;
  title: string;
  content?: string | undefined;
  type: DocumentType;
  status: DocumentStatus;
  sourceType: SourceType;
  sourceUrl?: string | undefined;
  mimeType?: string | undefined;
  tags: string[];
  summary?: string | undefined;
  metadata: Record<string, unknown>;
  lastOpenedAt?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
  // Internal fields
  ingestionStatus?: IngestionStatus | undefined;
  currentStage?: IngestionStage | undefined;
  embeddingsReady: boolean;
  ocrConfidence?: number | undefined;
  chunkCount?: number | undefined;
  ingestionError?: string | undefined;
  transcriptStatus: TranscriptStatus;
  transcriptError?: string | undefined;
}

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface DocumentTranscript {
  documentId: string;
  content: string;
  segments: TranscriptSegment[];
}
