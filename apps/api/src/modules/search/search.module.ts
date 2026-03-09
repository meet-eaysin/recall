import { Module } from '@nestjs/common';
import { NormalSearchService } from './domain/services/normal-search.service';
import { SemanticSearchService } from './domain/services/semantic-search.service';
import { RagService } from './domain/services/rag.service';
import { SearchUseCase } from './application/use-cases/search.usecase';
import { AskUseCase } from './application/use-cases/ask.usecase';
import { DocumentsModule } from '../documents/documents.module';
import { LLMConfigModule } from '../llm-config/llm-config.module';
import { SearchController } from './interface/search.controller';
import { AnalyticsModule } from '../analytics/analytics.module';
import { SearchChatService } from './domain/services/search-chat.service';

@Module({
  imports: [DocumentsModule, LLMConfigModule, AnalyticsModule],
  controllers: [SearchController],
  providers: [
    NormalSearchService,
    SemanticSearchService,
    RagService,
    SearchChatService,
    SearchUseCase,
    AskUseCase,
  ],
})
export class SearchModule {}
