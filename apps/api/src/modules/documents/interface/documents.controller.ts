import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateDocumentUseCase } from '../application/use-cases/create-document.usecase';
import { CreateUploadDocumentUseCase } from '../application/use-cases/create-upload-document.usecase';
import { DeleteDocumentUseCase } from '../application/use-cases/delete-document.usecase';
import { GetDocumentUseCase } from '../application/use-cases/get-document.usecase';
import { GetIngestionStatusUseCase } from '../application/use-cases/get-ingestion-status.usecase';
import { ListDocumentsUseCase } from '../application/use-cases/list-documents.usecase';
import { RetryIngestionUseCase } from '../application/use-cases/retry-ingestion.usecase';
import { SummaryUseCase } from '../application/use-cases/summary.usecase';
import { TranscriptUseCase } from '../application/use-cases/transcript.usecase';
import { UpdateDocumentUseCase } from '../application/use-cases/update-document.usecase';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  ListDocumentsDto,
  UploadDocumentDto,
} from './dtos/documents.schema';
import {
  DocumentPublicViewDto,
  DocumentResponseDto,
  IngestionStatusViewDto,
  TranscriptResponseDto,
} from './dtos/documents.response.dto';
import { DevUserGuard } from '../../../shared/guards/dev-user.guard';
import { User } from '../../../shared/decorators/user.decorator';
import { ApiPaginatedResponse } from '../../../shared/decorators/api-paginated-response.decorator';
import { ApiSuccessResponse } from 'src/shared/decorators/api-success-response.decorator';

@ApiTags('Documents')
@ApiBearerAuth('bearerAuth')
@Controller('documents')
@UseGuards(DevUserGuard)
export class DocumentsController {
  constructor(
    private readonly createDocumentUseCase: CreateDocumentUseCase,
    private readonly createUploadDocumentUseCase: CreateUploadDocumentUseCase,
    private readonly deleteDocumentUseCase: DeleteDocumentUseCase,
    private readonly getDocumentUseCase: GetDocumentUseCase,
    private readonly getIngestionStatusUseCase: GetIngestionStatusUseCase,
    private readonly listDocumentsUseCase: ListDocumentsUseCase,
    private readonly retryIngestionUseCase: RetryIngestionUseCase,
    private readonly summaryUseCase: SummaryUseCase,
    private readonly transcriptUseCase: TranscriptUseCase,
    private readonly updateDocumentUseCase: UpdateDocumentUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all documents with filters' })
  @ApiPaginatedResponse(DocumentPublicViewDto)
  async listDocuments(
    @User('userId') userId: string,
    @Query() filters: ListDocumentsDto,
  ) {
    return this.listDocumentsUseCase.execute(userId, filters);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new document via URL or source' })
  @ApiCreatedResponse({ type: DocumentResponseDto })
  async createDocument(
    @User('userId') userId: string,
    @Body() data: CreateDocumentDto,
  ) {
    const doc = await this.createDocumentUseCase.execute({
      userId,
      ...data,
      source: data.source,
    });
    return { document: doc };
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file as a document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The file to upload',
        },
        title: { type: 'string' },
        folderIds: { type: 'array', items: { type: 'string' } },
        tagIds: { type: 'array', items: { type: 'string' } },
        metadata: { type: 'object' },
      },
    },
  })
  @ApiCreatedResponse({ type: DocumentResponseDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @User('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadDocumentDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const doc = await this.createUploadDocumentUseCase.execute({
      userId,
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      title: body.title,
      folderIds: body.folderIds,
      tagIds: body.tagIds,
      metadata: body.metadata,
    });

    return { document: doc };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a document by ID' })
  @ApiSuccessResponse(DocumentResponseDto)
  async getDocument(@User('userId') userId: string, @Param('id') id: string) {
    const doc = await this.getDocumentUseCase.execute(id, userId);
    return { document: doc };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update document metadata' })
  @ApiSuccessResponse(DocumentResponseDto)
  async updateDocument(
    @User('userId') userId: string,
    @Param('id') id: string,
    @Body() data: UpdateDocumentDto,
  ) {
    const doc = await this.updateDocumentUseCase.execute({
      id,
      userId,
      data,
    });
    return { document: doc };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document' })
  @ApiNoContentResponse({ description: 'Document deleted successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDocument(
    @User('userId') userId: string,
    @Param('id') id: string,
  ) {
    await this.deleteDocumentUseCase.execute(id, userId);
  }

  @Get(':id/ingestion-status')
  @ApiOperation({ summary: 'Check document ingestion and processing status' })
  @ApiSuccessResponse(IngestionStatusViewDto)
  async getIngestionStatus(
    @User('userId') userId: string,
    @Param('id') id: string,
  ) {
    const status = await this.getIngestionStatusUseCase.execute(id, userId);
    return status;
  }

  @Post(':id/retry-ingestion')
  @ApiOperation({ summary: 'Retry a failed document ingestion' })
  @ApiSuccessResponse(IngestionStatusViewDto)
  async retryIngestion(
    @User('userId') userId: string,
    @Param('id') id: string,
  ) {
    const result = await this.retryIngestionUseCase.execute(id, userId);
    return result;
  }

  @Post(':id/summary')
  @ApiOperation({ summary: 'Trigger AI summary generation' })
  @ApiSuccessResponse(undefined, 'Summary generation started')
  async generateSummary(
    @User('userId') userId: string,
    @Param('id') id: string,
  ) {
    await this.summaryUseCase.generateSummary(id, userId);
    return { message: 'Summary generation started' };
  }

  @Delete(':id/summary')
  @ApiOperation({ summary: 'Delete a document summary' })
  @ApiNoContentResponse({ description: 'Summary deleted successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSummary(@User('userId') userId: string, @Param('id') id: string) {
    await this.summaryUseCase.deleteSummary(id, userId);
  }

  @Get(':id/transcript')
  @ApiOperation({ summary: 'Get document transcript' })
  @ApiSuccessResponse(TranscriptResponseDto)
  async getTranscript(@User('userId') userId: string, @Param('id') id: string) {
    const result = await this.transcriptUseCase.getTranscript(id, userId);
    return result;
  }

  @Post(':id/transcript')
  @ApiOperation({ summary: 'Manually trigger transcript generation' })
  @ApiSuccessResponse(TranscriptResponseDto)
  async generateTranscript(
    @User('userId') userId: string,
    @Param('id') id: string,
  ) {
    const result = await this.transcriptUseCase.generateTranscript(id, userId);
    return result;
  }
}
