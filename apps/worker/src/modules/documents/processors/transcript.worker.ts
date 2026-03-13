import { Processor, WorkerHost, OnWorkerEvent, Job } from '@repo/queue';
import { Injectable, Logger } from '@nestjs/common';
import {
  youtubeExtractor,
  chunkText,
  embeddingAdapter,
  QdrantWrapper,
  ProviderFactory,
} from '@repo/ai';
import { TranscriptJobData, QUEUE_TRANSCRIPT, DocumentType } from '@repo/types';
import {
  IDocumentRepository,
  DocumentTranscriptModel,
  DocumentChunkModel,
} from '@repo/db';
import { env } from '../../../shared/utils/env';

@Processor(QUEUE_TRANSCRIPT)
@Injectable()
export class TranscriptWorker extends WorkerHost {
  private readonly logger = new Logger(TranscriptWorker.name);
  private qdrant: QdrantWrapper;

  constructor(private readonly documentRepository: IDocumentRepository) {
    super();
    this.qdrant = new QdrantWrapper(env.QDRANT_URL, env.QDRANT_API_KEY);
  }

  async process(job: Job<TranscriptJobData>): Promise<void> {
    await this.processJob(job);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<TranscriptJobData> | undefined, err: Error) {
    this.logger.error(
      `[TranscriptWorker] Job ${job?.id} failed: ${err.message}`,
    );
  }

  private async processJob(job: Job<TranscriptJobData>): Promise<void> {
    const { documentId, userId } = job.data;

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
    const llmConfig = await ProviderFactory.getLLMConfig(userId);

    for (let i = 0; i < chunks.length; i++) {
      const chunkObj = chunks[i];
      if (!chunkObj || !chunkObj.content) continue;

      const vector = await embeddingAdapter.embedText(
        chunkObj.content,
        llmConfig,
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
