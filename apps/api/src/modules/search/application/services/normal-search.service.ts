import { Injectable } from '@nestjs/common';
import {
  DocumentEntity,
  DocumentPublicView,
} from '../../../documents/domain/entities/document.entity';
import { IDocumentRepository } from '../../../documents/domain/repositories/document.repository';
import { SearchQueryDto } from '../../interface/schemas/search.schema';

@Injectable()
export class NormalSearchService {
  constructor(private readonly documentRepository: IDocumentRepository) {}

  async search(
    userId: string,
    query: SearchQueryDto,
  ): Promise<{ docs: DocumentPublicView[]; total: number }> {
    const filters = {
      q: query.q,
      status: query.status,
      type: query.type,
      folderIds: query.folderIds,
      tagIds: query.tagIds,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };

    const { docs, total } = await this.documentRepository.findAll(
      userId,
      filters,
    );

    return {
      docs: docs.map((doc: DocumentEntity) => doc.toPublicView()),
      total,
    };
  }
}
