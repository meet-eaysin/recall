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
import { ListDocumentsDto } from '../../interface/dtos/documents.schema';

@Injectable()
export class ListDocumentsUseCase {
  constructor(private readonly documentRepository: IDocumentRepository) {}

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

    return {
      items: docs.map((doc: DocumentEntity) => doc.toPublicView()),
      total,
      page: docFilters.page,
      limit: docFilters.limit,
    };
  }
}
