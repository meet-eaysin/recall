import {
  Logger,
  Controller,
  Post,
  UseGuards,
  Body,
  Headers,
} from '@nestjs/common';
import { QStashGuard } from '../../../shared/guards/qstash.guard';
import {
  youtubeExtractor,
  chunkText,
  embeddingAdapter,
  QdrantWrapper,
  LLMClientFactory,
} from '@repo/ai';
import { QUEUE_TRANSCRIPT, DocumentType } from '@repo/types';
import type { TranscriptJobData } from '@repo/types';
import {
  IDocumentRepository,
  DocumentTranscriptModel,
  DocumentChunkModel,
} from '@repo/db';
import { env } from '../../../shared/utils/env';

@Controller('api/webhooks')
export class TranscriptController {
  private readonly logger = new Logger(TranscriptController.name);
  private qdrant: QdrantWrapper;

  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly llmClientFactory: LLMClientFactory,
  ) {
    this.qdrant = new QdrantWrapper(env.QDRANT_URL, env.QDRANT_API_KEY);
  }

  @Post(QUEUE_TRANSCRIPT)
  @UseGuards(QStashGuard)
  async process(
    @Body() data: TranscriptJobData,
    @Headers('Upstash-Message-Id') messageId: string,
  ): Promise<void> {
    try {
      await this.processJob(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `[TranscriptController] Job ${messageId} failed: ${errorMessage}`,
      );
      throw err;
    }
  }

  private async processJob(data: TranscriptJobData): Promise<void> {
    const { documentId, userId } = data;

    const doc = await this.documentRepository.findById(documentId, userId);
    if (!doc) throw new Error('Document not found');

    if (doc.type !== DocumentType.YOUTUBE) {
      this.logger.log(
        `[TranscriptWorker] Skipping non-youtube document: ${documentId}`,
      );
      return;
    }

    const existingTranscript = await DocumentTranscriptModel.findOne({
      documentId,
    }).exec();
    if (existingTranscript) {
      this.logger.log(
        `[TranscriptWorker] Transcript already exists for: ${documentId}`,
      );
      return;
    }

    if (!doc.sourceUrl) {
      throw new Error('No sourceUrl found for video transcript generation');
    }

    const result = await youtubeExtractor.extractYouTube(doc.sourceUrl);
    if (!result.transcript || result.transcript.length === 0) {
      throw new Error('Could not extract transcript from YouTube video');
    }

    const fullText = result.transcript.map((t) => t.text).join(' ');

    const transcriptDoc = new DocumentTranscriptModel({
      documentId,
      content: fullText,
      segments: result.transcript.map((t) => ({
        start: t.start,
        end: t.start + t.duration,
        text: t.text,
      })),
    });
    await transcriptDoc.save();

    const chunks = chunkText(fullText);
    const resolvedConfig = await this.llmClientFactory.resolveConfigForUserId(userId);

    for (let i = 0; i < chunks.length; i++) {
      const chunkObj = chunks[i];
      if (!chunkObj || !chunkObj.content) continue;

      const vector = await embeddingAdapter.embedText(
        chunkObj.content,
        resolvedConfig,
      );

      await this.qdrant.upsertPoints('mindstack', [
        {
          id: `${documentId}-${i}`,
          vector,
          payload: {
            documentId,
            userId,
            chunkIndex: i,
            text: chunkObj.content,
            type: doc.type,
            status: doc.status,
          },
        },
      ]);

      const chunkDoc = new DocumentChunkModel({
        documentId,
        chunkIndex: i,
        content: chunkObj.content,
        tokenCount: chunkObj.tokenCount,
        qdrantPointId: `${documentId}-${i}`,
      });
      await chunkDoc.save();
    }

    await this.documentRepository.update(documentId, userId, {
      embeddingsReady: true,
      chunkCount: chunks.length,
    });
  }
}
