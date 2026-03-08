import type { DocumentEntity } from '../entities/document.entity';
import type { DocFilters, IngestionStatusView } from '../types/document.types';

export type { DocFilters, IngestionStatusView };

export abstract class IDocumentRepository {
  abstract findById(id: string, userId: string): Promise<DocumentEntity | null>;
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
  abstract removeFolderFromAll(folderId: string, userId: string): Promise<void>;
  abstract removeTagFromAll(tagId: string, userId: string): Promise<void>;
}
