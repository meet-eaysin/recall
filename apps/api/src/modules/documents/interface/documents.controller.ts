import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { createReadStream } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { diskStorage } from 'multer';
import { env } from '../../../shared/utils/env';
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
import { SmartAddDocumentUseCase } from '../application/use-cases/smart-add-document.usecase';
import { DeleteDocumentUseCase } from '../application/use-cases/delete-document.usecase';
import { GetDocumentUseCase } from '../application/use-cases/get-document.usecase';
import { GetIngestionStatusUseCase } from '../application/use-cases/get-ingestion-status.usecase';
import { ListDocumentsUseCase } from '../application/use-cases/list-documents.usecase';
import { RetryIngestionUseCase } from '../application/use-cases/retry-ingestion.usecase';
import { SummaryUseCase } from '../application/use-cases/summary.usecase';
import { TranscriptUseCase } from '../application/use-cases/transcript.usecase';
import { UpdateDocumentUseCase } from '../application/use-cases/update-document.usecase';
import {
  UpdateDocumentDto,
  ListDocumentsDto,
  SmartAddDocumentDto,
} from './dtos/documents.schema';
import {
  DocumentPublicViewDto,
  DocumentResponseDto,
  IngestionStatusViewDto,
  TranscriptResponseDto,
} from './dtos/documents.response.dto';
import { User } from '../../../shared/decorators/user.decorator';
import { ApiPaginatedResponse } from '../../../shared/decorators/api-paginated-response.decorator';
import { ApiSuccessResponse } from '../../../shared/decorators/api-success-response.decorator';

@ApiTags('Documents')
@ApiBearerAuth('bearerAuth')
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly smartAddDocumentUseCase: SmartAddDocumentUseCase,
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
  @ApiOperation({ summary: 'Smart add document (URL or File)' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        source: { type: 'string', description: 'URL source if not a file' },
        file: {
          type: 'string',
          format: 'binary',
          description: 'The file to upload',
        },
        title: { type: 'string' },
        folderIds: { type: 'array', items: { type: 'string' } },
        tagIds: { type: 'array', items: { type: 'string' } },
        notes: { type: 'string' },
      },
    },
  })
  @ApiCreatedResponse({ type: DocumentResponseDto })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: env.FILE_UPLOAD_DIR || '/tmp/recall-uploads',
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, file.fieldname + '-' + uniqueSuffix);
        },
      }),
      limits: {
        fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
      },
    }),
  )
  async addDocument(
    @User('userId') userId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: SmartAddDocumentDto,
  ) {
    if (!file && !body.source) {
      throw new BadRequestException(
        'Either a file or a source URL must be provided',
      );
    }

    try {
      const doc = await this.smartAddDocumentUseCase.execute({
        userId,
        stream: file ? createReadStream(file.path) : undefined,
        originalName: file?.originalname,
        mimeType: file?.mimetype,
        source: body.source,
        title: body.title,
        folderIds: body.folderIds,
        tagIds: body.tagIds,
        notes: body.notes,
      });

      return { document: doc };
    } finally {
      // Cleanup temp file
      if (file?.path) {
        await unlink(file.path).catch(() => {});
      }
    }
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
