import { Injectable } from '@nestjs/common';
import { NormalSearchService } from '../services/normal-search.service';
import { SemanticSearchService } from '../services/semantic-search.service';
import { LLMClientFactory } from '@repo/ai';
import {
  SearchQueryDto,
  SemanticSearchResultDto,
} from '../../interface/schemas/search.schema';
import { DocumentPublicView } from '../../../documents/domain/entities/document.entity';

@Injectable()
export class SearchUseCase {
  constructor(
    private readonly normalSearchService: NormalSearchService,
    private readonly semanticSearchService: SemanticSearchService,
    private readonly llmClientFactory: LLMClientFactory,
  ) {}

  async execute(
    userId: string,
    query: SearchQueryDto,
  ): Promise<{
    items: (DocumentPublicView | SemanticSearchResultDto)[];
    total: number;
    page: number;
    limit: number;
    mode: 'normal' | 'ai';
  }> {
    if (query.mode === 'ai') {
      const config = await this.llmClientFactory.resolveConfigForUserId(userId);
      const results = await this.semanticSearchService.search(
        userId,
        query,
        config,
      );
      return {
        items: results,
        total: results.length,
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        mode: 'ai',
      };
    }

    // Default to 'normal'
    const { docs, total } = await this.normalSearchService.search(
      userId,
      query,
    );
    return {
      items: docs,
      total,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      mode: 'normal',
    };
  }
}
