import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { RagService } from '../../domain/services/rag.service';
import { LLMClientFactory } from '@repo/ai';
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
    private readonly llmClientFactory: LLMClientFactory,
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
    const conversationId = conversation.id;
    const activeDocumentIds =
      query.documentIds && query.documentIds.length > 0
        ? query.documentIds
        : conversation.props.documentIds;

    const history = await this.searchChatService.getPromptHistory(
      userId,
      conversationId,
    );
    
    const resolvedClient = await this.llmClientFactory.createForUserId(userId);
    const resolvedConfig = await this.llmClientFactory.resolveConfigForUserId(userId);

    const result = await this.ragService.ask(
      userId,
      query.question,
      resolvedClient,
      resolvedConfig,
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
    const conversationId = conversation.id;
    const activeDocumentIds =
      query.documentIds && query.documentIds.length > 0
        ? query.documentIds
        : conversation.props.documentIds;

    await handlers.onConversation(conversationId);

    const history = await this.searchChatService.getPromptHistory(
      userId,
      conversationId,
    );
    const resolvedClient = await this.llmClientFactory.createForUserId(userId);
    const resolvedConfig = await this.llmClientFactory.resolveConfigForUserId(userId);

    await this.ragService.stream(
      userId,
      query.question,
      resolvedClient,
      resolvedConfig,
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
}
