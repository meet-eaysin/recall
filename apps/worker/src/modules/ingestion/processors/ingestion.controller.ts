import {
  Logger,
  Controller,
  Post,
  UseGuards,
  Body,
  Headers,
  NotFoundException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { QueueWebhookGuard } from '../../../shared/guards/queue-webhook.guard';
import { QueueService } from '@repo/queue';
import {
  pdfExtractor,
  urlExtractor,
  youtubeExtractor,
  imageExtractor,
  chunkText,
  embeddingAdapter,
  QdrantWrapper,
  LLMClientFactory,
} from '@repo/ai';
import type { ResolvedLLMConfig } from '@repo/ai';
import {
  IngestionStatus,
  IngestionStage,
  NotionAction,
  QUEUE_INGESTION,
  QUEUE_GRAPH,
  QUEUE_NOTION_SYNC,
} from '@repo/types';
import type { IngestionJobData } from '@repo/types';
import {
  IDocumentRepository,
  IIngestionJobRepository,
  LocalStorage,
  TagModel,
  DocumentModel,
  DocumentChunkModel,
} from '@repo/db';
import { env } from '../../../shared/utils/env';
import { Types } from 'mongoose';
import axios from 'axios';
import * as crypto from 'crypto';

@Controller('api/webhooks')
export class IngestionController {
  private readonly logger = new Logger(IngestionController.name);
  private qdrant: QdrantWrapper;

  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly ingestionJobRepository: IIngestionJobRepository,
    private readonly localStorage: LocalStorage,
    private readonly queueService: QueueService,
    private readonly llmClientFactory: LLMClientFactory,
  ) {
    this.qdrant = new QdrantWrapper(env.QDRANT_URL, env.QDRANT_API_KEY);
  }

  @Post(QUEUE_INGESTION)
  @UseGuards(QueueWebhookGuard)
  async process(
    @Body() data: IngestionJobData,
    @Headers('Upstash-Message-Id') messageId: string,
  ): Promise<void> {
    try {
      await this.processJob(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(
        `Job ${messageId} failed: ${errorMessage}`,
      );
      const { documentId, userId } = data;
      await this.ingestionJobRepository.markFailed(documentId, errorMessage);
      await this.documentRepository.update(documentId, userId, {
        ingestionStatus: IngestionStatus.FAILED,
        ingestionError: errorMessage,
      });

      if (err instanceof HttpException) {
        throw err;
      }
      throw new InternalServerErrorException('Ingestion job failed');
    }
  }

  private async processJob(data: IngestionJobData): Promise<void> {
    const { documentId, userId } = data;

    this.logger.log(
      `Starting ingestion for document: ${documentId}, user: ${userId}`,
    );
 
    const doc = await this.documentRepository.findById(documentId, userId);
    if (!doc) {
      this.logger.error(
        `Document not found: ${documentId} for user: ${userId}`,
      );
      throw new NotFoundException('Document not found');
    }

    const type = doc.type;
    const source = doc.sourceUrl || '';

    await this.ingestionJobRepository.updateStage(
      documentId,
      IngestionStage.START,
      IngestionStatus.PROCESSING,
      userId,
    );

    await this.documentRepository.update(documentId, userId, {
      ingestionStatus: IngestionStatus.PROCESSING,
    });

    try {
      await this.ingestionJobRepository.updateStage(
        documentId,
        IngestionStage.EXTRACT,
        IngestionStatus.PROCESSING,
        userId,
      );
      let text = '';
      let ocrConfidence = 100;

      if (type === 'pdf') {
        const buffer = await this.localStorage.getFile(source);
        const result = await pdfExtractor.extractPdf(buffer);
        text = result.text;
        ocrConfidence = result.ocrConfidence;
        await this.documentRepository.update(documentId, userId, {
          ocrConfidence,
        });
      } else if (type === 'url') {
        const result = await urlExtractor.extractFromUrl(source);
        text = result.markdown;
        await this.documentRepository.update(documentId, userId, {
          renderedMarkdown: text,
        });
      } else if (type === 'youtube') {
        const result = await youtubeExtractor.extractYouTube(source);
        text = result.transcript.map((t) => t.text).join(' ');
      } else if (type === 'image') {
        const buffer = await this.localStorage.getFile(source);
        const result = await imageExtractor.extractImage(buffer);
        text = result.text;
        ocrConfidence = result.ocrConfidence;
        await this.documentRepository.update(documentId, userId, {
          ocrConfidence,
        });
      } else if (type === 'text') {
        if (doc.sourceType === 'file') {
          const buffer = await this.localStorage.getFile(source);
          text = buffer.toString('utf-8');
        } else {
          text = source;
        }
      }

      if (text.length < 50) {
        await this.documentRepository.update(documentId, userId, {
          ingestionStatus: IngestionStatus.COMPLETED,
          embeddingsReady: false,
        });
        await this.ingestionJobRepository.updateStage(
          documentId,
          IngestionStage.DONE,
          IngestionStatus.COMPLETED,
          userId,
        );
        return;
      }

      await this.ingestionJobRepository.updateStage(
        documentId,
        IngestionStage.CLASSIFY,
        IngestionStatus.PROCESSING,
        userId,
      );
      const config = await this.llmClientFactory.resolveConfigForUserId(userId);
      try {
        const topics = await this.classifyTopics(
          text.substring(0, 5000),
          config,
        );
        if (topics.length > 0) {
          for (const topic of topics) {
            const tag = await TagModel.findOneAndUpdate(
              { userId: new Types.ObjectId(userId), name: topic.toLowerCase() },
              { $setOnInsert: { source: 'ai', color: '#6366f1' } },
              { upsert: true, new: true },
            );
            if (tag) {
              await DocumentModel.updateOne(
                { _id: new Types.ObjectId(documentId) },
                { $addToSet: { tags: tag.name } },
              );
            }
          }
        }
      } catch (error) {
        this.logger.warn(
          `Topic classification skipped: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }

      await this.ingestionJobRepository.updateStage(
        documentId,
        IngestionStage.CHUNK,
        IngestionStatus.PROCESSING,
        userId,
      );
      const chunks = chunkText(text);

      await DocumentChunkModel.deleteMany({
        documentId: new Types.ObjectId(documentId),
      });

      const chunkDocs = chunks.map((c) => ({
        documentId: new Types.ObjectId(documentId),
        userId: new Types.ObjectId(userId),
        content: c.content,
        index: c.index,
        tokenCount: c.tokenCount,
        metadata: {
          chunkIndex: c.index,
          heading: c.headingContext,
        },
        createdAt: new Date(),
      }));

      await DocumentChunkModel.insertMany(chunkDocs);

      await this.ingestionJobRepository.updateStage(
        documentId,
        IngestionStage.EMBED,
        IngestionStatus.PROCESSING,
        userId,
      );
      await this.qdrant.ensureCollection('mindstack', 768);

      const embeddings = await embeddingAdapter.embedBatch(
        chunks.map((c) => c.content),
        config,
      );

      const points = chunks
        .map((chunk, i) => {
          const vector = embeddings[i];
          if (!vector) return null;
          return {
            vector,
            payload: {
              documentId: documentId.toString(),
              userId: userId.toString(),
              chunkIndex: chunk.index,
            },
          };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);

      if (points.length > 0) {
        // Clean up any existing points for this document to prevent duplicates
        // if re-indexing happened with different chunk counts
        await this.qdrant.deleteByFilter('mindstack', {
          must: [
            { key: 'documentId', match: { value: documentId.toString() } }
          ]
        });
        
        // Generate deterministic IDs for the points for double-protection
        const pointsForUpsert = points.map(p => {
          // Create a deterministic UUID from documentId and chunkIndex
          const hash = crypto.createHash('md5')
            .update(`${documentId.toString()}-${p.payload.chunkIndex}`)
            .digest('hex');
          
          // Format as UUID: 8-4-4-4-12
          const id = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
          
          return {
            id,
            vector: p.vector,
            payload: p.payload,
          };
        });

        await this.qdrant.upsertPoints('mindstack', pointsForUpsert);
      }

      await this.ingestionJobRepository.updateStage(
        documentId,
        IngestionStage.GRAPH,
        IngestionStatus.PROCESSING,
        userId,
      );
      await this.queueService.publishMessage(QUEUE_GRAPH, {
        documentId,
        userId,
      });

      await this.documentRepository.update(documentId, userId, {
        ingestionStatus: IngestionStatus.COMPLETED,
        embeddingsReady: true,
        chunkCount: chunks.length,
        content: text.substring(0, 10000),
      });
      await this.ingestionJobRepository.updateStage(
        documentId,
        IngestionStage.DONE,
        IngestionStatus.COMPLETED,
        userId,
      );

      await this.queueService.publishMessage(QUEUE_NOTION_SYNC, {
        documentId,
        userId,
        action: NotionAction.CREATE,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        'Ingestion failed',
        error instanceof Error ? error.stack : undefined,
      );
      await this.documentRepository.update(documentId, userId, {
        ingestionStatus: IngestionStatus.FAILED,
        ingestionError: errorMessage || 'Unknown error',
      });
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Ingestion failed');
    }
  }

  private async classifyTopics(
    text: string,
    config: ResolvedLLMConfig,
  ): Promise<string[]> {
    if (config.provider === 'ollama') {
      try {
        interface OllamaGenerateResponse {
          response: string;
        }
        const response = await axios.post<OllamaGenerateResponse>(
          `${config.baseUrl}/api/generate`,
          {
            model: config.chatModel,
            prompt: `Extract 3-5 main topics from this text as a comma-separated list. Only return the list.\n\nText: ${text}`,
            stream: false,
          },
          { timeout: 10000 },
        );
        const responseText = response.data?.response;
        if (typeof responseText === 'string') {
          return responseText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        }
      } catch {
        return [];
      }
    }
    return [];
  }
}
