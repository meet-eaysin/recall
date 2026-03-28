import {
  Logger,
  Controller,
  Post,
  UseGuards,
  Body,
  Headers,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { QueueWebhookGuard } from '../../../shared/guards/queue-webhook.guard';
import {
  youtubeExtractor,
  chunkText,
  embeddingAdapter,
  QdrantWrapper,
  LLMClientFactory,
  YouTubeExtractResult,
  ResolvedLLMConfig,
  ChunkResult,
} from '@repo/ai';
import { QUEUE_TRANSCRIPT, DocumentType, TranscriptStatus } from '@repo/types';
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
  @UseGuards(QueueWebhookGuard)
  async process(
    @Body() data: TranscriptJobData,
    @Headers('Upstash-Message-Id') messageId: string,
  ): Promise<void> {
    try {
      await this.processJob(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(
        `[TranscriptController] Job ${messageId} failed: ${errorMessage}`,
      );
      if (err instanceof HttpException) {
        throw err;
      }
      throw new InternalServerErrorException('Transcript job failed');
    }
  }

  private async processJob(data: TranscriptJobData): Promise<void> {
    const { documentId, userId } = data;

    const doc = await this.documentRepository.findById(documentId, userId);
    if (!doc) {
      throw new NotFoundException('Document not found');
    }

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
      throw new BadRequestException(
        'No sourceUrl found for video transcript generation',
      );
    }

    let result: YouTubeExtractResult;
    let transcriptStatus = TranscriptStatus.COMPLETED;
    let transcriptError: string | undefined = undefined;

    try {
      result = await youtubeExtractor.extractYouTube(doc.sourceUrl);
      if (!result.transcript || result.transcript.length === 0) {
        transcriptStatus = TranscriptStatus.UNAVAILABLE;
        transcriptError =
          'No transcript available for this video (disabled or not provided).';
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      this.logger.warn(
        `[TranscriptWorker] Failed to extract transcript for ${documentId}: ${errorMsg}`,
      );
      transcriptStatus = TranscriptStatus.FAILED;
      transcriptError = errorMsg;
      result = {
        videoId: '',
        title: '',
        channelTitle: '',
        description: '',
        transcript: [],
        fullText: '',
      };
    }

    const fullText = result.fullText || '';

    if (
      transcriptStatus === TranscriptStatus.COMPLETED &&
      result.transcript.length > 0
    ) {
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
    }

    const textToChunk = fullText || '';
    const chunks: ChunkResult[] = chunkText(textToChunk);
    const resolvedConfig: ResolvedLLMConfig =
      await this.llmClientFactory.resolveConfigForUserId(userId);

    for (let i = 0; i < chunks.length; i++) {
      const chunkObj = chunks[i];
      if (!chunkObj || !chunkObj.content) continue;

      const vector = await embeddingAdapter.embedText(
        String(chunkObj.content),
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
      embeddingsReady: transcriptStatus === TranscriptStatus.COMPLETED,
      chunkCount: chunks.length,
      transcriptStatus,
      transcriptError,
    });
  }
}
