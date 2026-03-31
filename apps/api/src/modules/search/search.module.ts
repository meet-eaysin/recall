import { Module } from '@nestjs/common';
import { RagService } from './infrastructure/services/rag.service';
import { SearchUseCase } from './application/use-cases/search.usecase';
import { AskUseCase } from './application/use-cases/ask.usecase';
import { SearchChatService } from './application/services/search-chat.service';
import { NormalSearchService } from './application/services/normal-search.service';
import { SemanticSearchService } from './application/services/semantic-search.service';
import { DocumentsModule } from '../documents/documents.module';
import { SearchController } from './interface/search.controller';
import { AnalyticsModule } from '../analytics/analytics.module';
import { IChatConversationRepository } from './domain/repositories/chat-conversation.repository';
import { MongooseChatConversationRepository } from './infrastructure/persistence/mongoose-chat-conversation.repository';

@Module({
  imports: [DocumentsModule, AnalyticsModule],
  controllers: [SearchController],
  providers: [
    NormalSearchService,
    SemanticSearchService,
    RagService,
    SearchChatService,
    SearchUseCase,
    AskUseCase,
    {
      provide: IChatConversationRepository,
      useClass: MongooseChatConversationRepository,
    },
  ],
  exports: [IChatConversationRepository, SearchChatService],
})
export class SearchModule {}
