import type { Document, Types } from 'mongoose';
import {
  DocumentType,
  DocumentStatus,
  SourceType,
  IngestionStatus,
  IngestionStage,
  TranscriptStatus,
} from '@repo/types';

export {
  DocumentType,
  DocumentStatus,
  SourceType,
  IngestionStatus,
  IngestionStage,
  TranscriptStatus,
};

export interface IDocument {
  _id: Types.ObjectId;
  userId: string;
  folderId?: Types.ObjectId | undefined;
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

  // Ingestion tracking
  ingestionStatus?: IngestionStatus | undefined;
  currentStage?: IngestionStage | undefined;
  embeddingsReady?: boolean | undefined;
  ocrConfidence?: number | undefined;
  chunkCount?: number | undefined;
  ingestionError?: string | undefined;

  notionPageId?: string | undefined;

  transcriptStatus?: TranscriptStatus | undefined;
  transcriptError?: string | undefined;

  lastOpenedAt?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export type IDocumentDocument = IDocument & Document;
