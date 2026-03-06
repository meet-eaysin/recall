import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DevUserGuard } from '../../../shared/guards/dev-user.guard';
import { SearchUseCase } from '../application/use-cases/search.usecase';
import { AskUseCase } from '../application/use-cases/ask.usecase';
import {
  SearchQueryDto,
  AskQueryDto,
  SemanticSearchResultDto,
  AskResultDto,
} from './schemas/search.schema';
import { User } from '../../../shared/decorators/user.decorator';
import { ApiPaginatedResponse } from '../../../shared/decorators/api-paginated-response.decorator';
import { ApiSuccessResponse } from 'src/shared/decorators/api-success-response.decorator';

@ApiTags('Search & AI')
@ApiBearerAuth('bearerAuth')
@Controller('search')
@UseGuards(DevUserGuard)
export class SearchController {
  constructor(
    private readonly searchUseCase: SearchUseCase,
    private readonly askUseCase: AskUseCase,
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
}
