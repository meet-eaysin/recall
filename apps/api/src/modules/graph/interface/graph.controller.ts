import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { DevUserGuard } from '../../../shared/guards/dev-user.guard';
import { GetFullGraphUseCase } from '../application/use-cases/get-full-graph.usecase';
import { GetDocumentSubgraphUseCase } from '../application/use-cases/get-document-subgraph.usecase';
import { RebuildDocumentGraphUseCase } from '../application/use-cases/rebuild-document-graph.usecase';
import { User } from '../../../shared/decorators/user.decorator';
import { FullGraphResponseDto } from './dtos/graph.response.dto';
import { ApiSuccessResponse } from 'src/shared/decorators/api-success-response.decorator';

@ApiTags('Knowledge Graph')
@ApiBearerAuth('bearerAuth')
@Controller('graph')
@UseGuards(DevUserGuard)
export class GraphController {
  constructor(
    private readonly getFullGraphUseCase: GetFullGraphUseCase,
    private readonly getSubgraphUseCase: GetDocumentSubgraphUseCase,
    private readonly rebuildGraphUseCase: RebuildDocumentGraphUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get the full knowledge graph for the authenticated user',
  })
  @ApiSuccessResponse(FullGraphResponseDto)
  async getFullGraph(@User('userId') userId: string) {
    const result = await this.getFullGraphUseCase.execute(userId);
    return result;
  }

  @Get('document/:docId')
  @ApiOperation({
    summary: 'Get a subgraph centered around a specific document',
  })
  @ApiParam({ name: 'docId', description: 'The ID of the document' })
  @ApiSuccessResponse(FullGraphResponseDto)
  async getDocumentSubgraph(
    @Param('docId') docId: string,
    @User('userId') userId: string,
  ) {
    const result = await this.getSubgraphUseCase.execute(docId, userId);
    return result;
  }

  @Post('rebuild/:docId')
  @ApiOperation({ summary: 'Manually trigger a graph rebuild for a document' })
  @ApiParam({ name: 'docId', description: 'The ID of the document to rebuild' })
  @ApiSuccessResponse(undefined, 'Graph rebuild started')
  @HttpCode(HttpStatus.ACCEPTED)
  async rebuildDocumentGraph(
    @Param('docId') docId: string,
    @User('userId') userId: string,
  ) {
    const result = await this.rebuildGraphUseCase.execute(docId, userId);
    return result;
  }
}
