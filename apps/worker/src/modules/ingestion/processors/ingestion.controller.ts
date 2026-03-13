import { Logger, Controller, Post, UseGuards, Body, Headers } from '@nestjs/common';
import { QStashGuard } from '../../../shared/guards/qstash.guard';
import { QStashService } from '@repo/queue';
import {
  pdfExtractor,
  urlExtractor,
  youtubeExtractor,
  imageExtractor,
  chunkText,
  embeddingAdapter,
  QdrantWrapper,
  ProviderFactory,
  ResolvedLLMConfig,
} from '@repo/ai';
import {
  IngestionJobData,
  IngestionStatus,
  IngestionStage,
  NotionAction,
  QUEUE_INGESTION,
  QUEUE_GRAPH,
  QUEUE_NOTION_SYNC,
  NotionSyncJobData,
  GraphJobData,
} from '@repo/types';
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
    private readonly qstashService: QStashService,
  ) {
    this.qdrant = new QdrantWrapper(env.QDRANT_URL, env.QDRANT_API_KEY);
  }

  @Post(QUEUE_INGESTION)
  @UseGuards(QStashGuard)
  async process(
    @Body() data: IngestionJobData,
    @Headers('Upstash-Message-Id') messageId: string,
  ): Promise<void> {
    try {
      await this.processJob(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `[IngestionController] Job ${messageId} failed: ${errorMessage}`,
      );
      const { documentId, userId } = data;
      await this.ingestionJobRepository.markFailed(documentId, errorMessage);
      await this.documentRepository.update(documentId, userId, {
        ingestionStatus: IngestionStatus.FAILED as any,
        ingestionError: errorMessage,
      });

      throw err;
    }
  }

  private async processJob(data: IngestionJobData): Promise<void> {
    const { documentId, userId } = data;

    const doc = await this.documentRepository.findById(documentId, userId);
    if (!doc) throw new Error('Document not found');

    const type = doc.type;
    const source = doc.sourceUrl || '';

    await this.ingestionJobRepository.updateStage(
      documentId,
      IngestionStage.START,
      IngestionStatus.PROCESSING,
      userId,
    );

    await this.documentRepository.update(documentId, userId, {
      ingestionStatus: IngestionStatus.PROCESSING as any,
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
        } as any);
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
        text = source;
      }

      if (text.length < 50) {
        await this.documentRepository.update(documentId, userId, {
          ingestionStatus: IngestionStatus.COMPLETED as any,
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
      const config = await ProviderFactory.getLLMConfig(userId);
      try {
        const topics = await this.classifyTopics(
          text.substring(0, 5000),
          config,
        );
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
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Classification failed: ${msg}, skipping...`);
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
            id: crypto.randomUUID(),
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
        await this.qdrant.upsertPoints('mindstack', points);
      }

      await this.ingestionJobRepository.updateStage(
        documentId,
        IngestionStage.GRAPH,
        IngestionStatus.PROCESSING,
        userId,
      );
      await this.qstashService.publishMessage(QUEUE_GRAPH, { documentId, userId });

      await this.documentRepository.update(documentId, userId, {
        ingestionStatus: IngestionStatus.COMPLETED as any,
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

      await this.qstashService.publishMessage(QUEUE_NOTION_SYNC, {
        documentId,
        userId,
        action: NotionAction.CREATE,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Ingestion failed: ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }

  private async classifyTopics(
    text: string,
    config: ResolvedLLMConfig,
  ): Promise<string[]> {
    if (config.provider === 'ollama') {
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
      );
      const responseText = response.data?.response;
      if (typeof responseText === 'string') {
        return responseText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }
    return [];
  }
}
