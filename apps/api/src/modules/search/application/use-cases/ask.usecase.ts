import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { RagService } from '../../domain/services/rag.service';
import { ProviderFactory } from '@repo/ai';
import {
  AskQueryDto,
  AskResultDto,
} from '../../interface/schemas/search.schema';
import { IUserActivityRepository } from '../../../analytics/domain/repositories/user-activity.repository';
import { SearchChatService } from '../../domain/services/search-chat.service';

@Injectable()
export class AskUseCase {
  private readonly logger = new Logger(AskUseCase.name);

  constructor(
    private readonly ragService: RagService,
    private readonly searchChatService: SearchChatService,
    private readonly userActivityRepository: IUserActivityRepository,
  ) {}

  async execute(userId: string, query: AskQueryDto): Promise<AskResultDto> {
    if (!query.question || query.question.trim().length === 0) {
      throw new BadRequestException('Question cannot be empty');
    }

    const conversation =
      query.conversationId != null
        ? await this.searchChatService.getConversationForUser(
            userId,
            query.conversationId,
          )
        : await this.searchChatService.createConversation(
            userId,
            query.question,
            query.documentIds,
          );
    const conversationId = this.getConversationId(conversation);
    const activeDocumentIds =
      query.documentIds && query.documentIds.length > 0
        ? query.documentIds
        : conversation.documentIds;

    const history = await this.searchChatService.getPromptHistory(
      userId,
      conversationId,
    );
    const llmConfig = await ProviderFactory.getLLMConfig(userId);
    const result = await this.ragService.ask(
      userId,
      query.question,
      llmConfig,
      activeDocumentIds,
      history,
    );
    const detail = await this.searchChatService.appendExchange({
      answer: result.answer,
      conversationId,
      documentIds: activeDocumentIds,
      question: query.question,
      sources: result.sources,
      tokensUsed: result.tokensUsed,
      userId,
    });

    // Log user activity asynchronously
    this.userActivityRepository
      .recordActivity({
        userId,
        targetId: userId,
        targetType: 'ask_result',
        action: 'ask_performed',
        metadata: {
          tokensUsed: result.tokensUsed,
          sourcesCount: result.sources.length,
        },
      })
      .catch((error: unknown) => {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to log user activity: ${msg}`);
      });

    return {
      ...result,
      conversationId: detail.id,
    };
  }

  async executeStream(
    userId: string,
    query: AskQueryDto,
    handlers: {
      onComplete: (result: AskResultDto) => Promise<void>;
      onError: (message: string) => Promise<void>;
      onToken: (chunk: string) => Promise<void>;
      onConversation: (conversationId: string) => Promise<void>;
    },
  ): Promise<void> {
    if (!query.question || query.question.trim().length === 0) {
      throw new BadRequestException('Question cannot be empty');
    }

    const conversation =
      query.conversationId != null
        ? await this.searchChatService.getConversationForUser(
            userId,
            query.conversationId,
          )
        : await this.searchChatService.createConversation(
            userId,
            query.question,
            query.documentIds,
          );
    const conversationId = this.getConversationId(conversation);
    const activeDocumentIds =
      query.documentIds && query.documentIds.length > 0
        ? query.documentIds
        : conversation.documentIds;

    await handlers.onConversation(conversationId);

    const history = await this.searchChatService.getPromptHistory(
      userId,
      conversationId,
    );
    const llmConfig = await ProviderFactory.getLLMConfig(userId);

    await this.ragService.stream(
      userId,
      query.question,
      llmConfig,
      {
        onComplete: async (result) => {
          const detail = await this.searchChatService.appendExchange({
            answer: result.answer,
            conversationId,
            documentIds: activeDocumentIds,
            question: query.question,
            sources: result.sources,
            tokensUsed: result.tokensUsed,
            userId,
          });

          this.userActivityRepository
            .recordActivity({
              userId,
              targetId: userId,
              targetType: 'ask_result',
              action: 'ask_performed',
              metadata: {
                tokensUsed: result.tokensUsed,
                sourcesCount: result.sources.length,
              },
            })
            .catch((error: unknown) => {
              const msg =
                error instanceof Error ? error.message : String(error);
              this.logger.error(`Failed to log user activity: ${msg}`);
            });

          await handlers.onComplete({
            ...result,
            conversationId: detail.id,
          });
        },
        onError: handlers.onError,
        onToken: handlers.onToken,
      },
      activeDocumentIds,
      history,
    );
  }

  private getConversationId(conversation: {
    id?: unknown;
    _id?: { toString(): string } | string;
  }): string {
    if (typeof conversation.id === 'string' && conversation.id.length > 0) {
      return conversation.id;
    }

    if (typeof conversation._id === 'string' && conversation._id.length > 0) {
      return conversation._id;
    }

    if (conversation._id && typeof conversation._id.toString === 'function') {
      return conversation._id.toString();
    }

    throw new Error('Conversation id is missing');
  }
}
