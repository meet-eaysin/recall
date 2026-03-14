import { Module } from '@nestjs/common';
import { NormalSearchService } from './domain/services/normal-search.service';
import { SemanticSearchService } from './domain/services/semantic-search.service';
import { RagService } from './domain/services/rag.service';
import { SearchUseCase } from './application/use-cases/search.usecase';
import { AskUseCase } from './application/use-cases/ask.usecase';
import { DocumentsModule } from '../documents/documents.module';
import { SearchController } from './interface/search.controller';
import { AnalyticsModule } from '../analytics/analytics.module';
import { SearchChatService } from './domain/services/search-chat.service';
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
