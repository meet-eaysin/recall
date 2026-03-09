import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Param,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SearchUseCase } from '../application/use-cases/search.usecase';
import { AskUseCase } from '../application/use-cases/ask.usecase';
import {
  SearchQueryDto,
  AskQueryDto,
  SemanticSearchResultDto,
  AskResultDto,
  ChatConversationDto,
  ChatConversationListDto,
} from './schemas/search.schema';
import { User } from '../../../shared/decorators/user.decorator';
import { ApiPaginatedResponse } from '../../../shared/decorators/api-paginated-response.decorator';
import { ApiSuccessResponse } from '../../../shared/decorators/api-success-response.decorator';
import { SearchChatService } from '../domain/services/search-chat.service';
import type { Response } from 'express';

@ApiTags('Search & AI')
@ApiBearerAuth('bearerAuth')
@Controller('search')
export class SearchController {
  constructor(
    private readonly searchUseCase: SearchUseCase,
    private readonly askUseCase: AskUseCase,
    private readonly searchChatService: SearchChatService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Perform semantic search across documents' })
  @ApiPaginatedResponse(SemanticSearchResultDto)
  async search(@User('userId') userId: string, @Query() query: SearchQueryDto) {
    return this.searchUseCase.execute(userId, query);
  }

  @Post('ask')
  @ApiOperation({
    summary: 'Ask a natural language question based on your documents (RAG)',
  })
  @ApiSuccessResponse(AskResultDto)
  async ask(@User('userId') userId: string, @Body() query: AskQueryDto) {
    const result = await this.askUseCase.execute(userId, query);
    return result;
  }

  @Post('ask/stream')
  @ApiOperation({
    summary: 'Ask a question and stream the response progressively',
  })
  async askStream(
    @User('userId') userId: string,
    @Body() query: AskQueryDto,
    @Res() response: Response,
  ) {
    response.status(200);
    response.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');

    try {
      await this.askUseCase.executeStream(userId, query, {
        onConversation: async (conversationId) => {
          response.write(
            `${JSON.stringify({ type: 'conversation', conversationId })}\n`,
          );
        },
        onToken: async (chunk) => {
          response.write(`${JSON.stringify({ type: 'delta', chunk })}\n`);
        },
        onError: async (message) => {
          response.write(`${JSON.stringify({ type: 'error', message })}\n`);
        },
        onComplete: async (result) => {
          response.write(`${JSON.stringify({ type: 'done', data: result })}\n`);
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      response.write(`${JSON.stringify({ type: 'error', message })}\n`);
    } finally {
      response.end();
    }
  }

  @Get('chats')
  @ApiOperation({ summary: 'List previous AI chat conversations' })
  @ApiSuccessResponse(ChatConversationListDto)
  async listChats(@User('userId') userId: string) {
    const conversations = await this.searchChatService.listConversations(userId);
    return { conversations };
  }

  @Get('chats/:id')
  @ApiOperation({ summary: 'Get one AI chat conversation with messages' })
  @ApiSuccessResponse(ChatConversationDto)
  async getChat(@User('userId') userId: string, @Param('id') id: string) {
    const conversation = await this.searchChatService.getConversationDetail(
      userId,
      id,
    );
    return { conversation };
  }
}
