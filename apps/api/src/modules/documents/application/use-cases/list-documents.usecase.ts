import { Injectable } from '@nestjs/common';
import {
  IDocumentRepository,
  DocFilters,
} from '../../domain/repositories/document.repository';
import {
  DocumentPublicView,
  DocumentEntity,
} from '../../domain/entities/document.entity';
import type { PaginatedResponse } from '@repo/types';
import { SourceType } from '@repo/types';
import { IStorageProvider } from '@repo/storage';
import { ListDocumentsDto } from '../../interface/dtos/documents.schema';

@Injectable()
export class ListDocumentsUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly storageProvider: IStorageProvider,
  ) {}

  async execute(
    userId: string,
    filters: ListDocumentsDto,
  ): Promise<PaginatedResponse<DocumentPublicView>> {
    const docFilters: DocFilters = {
      ...filters,
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
    };

    const { docs, total } = await this.documentRepository.findAll(
      userId,
      docFilters,
    );

    const items = await Promise.all(
      docs.map(async (doc: DocumentEntity) => {
        const view = doc.toPublicView();
        if (view.sourceType === SourceType.FILE && view.sourceUrl) {
          try {
            view.sourceUrl = await this.storageProvider.getSignedUrl(
              view.sourceUrl,
            );
          } catch (err) {
            // Log but don't fail the whole list
            console.error(`Failed to sign URL for ${doc.id}:`, err);
          }
        }
        return view;
      }),
    );
  
    return {
      items,
      total,
      page: docFilters.page,
      limit: docFilters.limit,
    };
  }
}
