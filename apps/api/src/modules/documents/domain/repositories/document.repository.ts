import type { DocumentEntity } from '../entities/document.entity';
import type { DocFilters, IngestionStatusView } from '../types/document.types';

export type { DocFilters, IngestionStatusView };

export interface DocumentChunkRecord {
  content: string;
  index: number;
  tokenCount: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export abstract class IDocumentRepository {
  abstract findById(id: string, userId: string): Promise<DocumentEntity | null>;
  abstract findAllByUserId(userId: string): Promise<DocumentEntity[]>;
  abstract findAll(
    userId: string,
    filters: DocFilters,
  ): Promise<{ docs: DocumentEntity[]; total: number }>;
  abstract create(doc: DocumentEntity): Promise<DocumentEntity>;
  abstract update(
    id: string,
    userId: string,
    data: Record<string, unknown>,
  ): Promise<DocumentEntity | null>;
  abstract delete(id: string, userId: string): Promise<boolean>;
  abstract existsBySource(
    userId: string,
    source: string,
  ): Promise<string | null>;
  abstract getIngestionStatus(
    id: string,
    userId: string,
  ): Promise<IngestionStatusView | null>;
  abstract listChunks(documentId: string): Promise<DocumentChunkRecord[]>;
  abstract replaceChunks(
    documentId: string,
    userId: string,
    chunks: Array<
      Omit<DocumentChunkRecord, 'createdAt'> & {
        createdAt?: Date;
      }
    >,
  ): Promise<void>;
  abstract removeFolderFromAll(folderId: string, userId: string): Promise<void>;
  abstract removeTagFromAll(tagId: string, userId: string): Promise<void>;
  abstract deleteAllByUserId(userId: string): Promise<void>;
}
