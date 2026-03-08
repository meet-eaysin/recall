import { Worker, Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { TranscriptJobData, createRedisConnection } from '@repo/queue';
import {
  youtubeExtractor,
  chunkText,
  embeddingAdapter,
  QdrantWrapper,
  ProviderFactory,
} from '@repo/ai';
import { IDocumentRepository } from '../../../documents/domain/repositories/document.repository';
import { env } from '../../../../shared/utils/env';
import { DocumentTranscriptModel, DocumentChunkModel } from '@repo/db';

@Injectable()
export class TranscriptWorker {
  private readonly logger = new Logger(TranscriptWorker.name);
  private _worker: Worker<TranscriptJobData>;
  private qdrant: QdrantWrapper;

  constructor(private readonly documentRepository: IDocumentRepository) {
    const redis = createRedisConnection(env.REDIS_URL);
    this.qdrant = new QdrantWrapper(env.QDRANT_URL, env.QDRANT_API_KEY);

    this._worker = new Worker<TranscriptJobData>(
      'transcript',
      async (job: Job<TranscriptJobData>) => {
        await this.processJob(job);
      },
      {
        connection: redis,
        concurrency: 5,
        prefix: 'mindstack',
        lockDuration: 300000,
        stalledInterval: 300000,
        maxStalledCount: 0,
      },
    );

    this._worker.on('failed', async (job, err) => {
      this.logger.error(
        `[TranscriptWorker] Job ${job?.id} failed: ${err.message}`,
      );
    });

    this.logger.log('[TranscriptWorker] Worker started and listening to queue');
  }

  private async processJob(job: Job<TranscriptJobData>): Promise<void> {
    const { documentId, userId } = job.data;

    const doc = await this.documentRepository.findById(documentId, userId);
    if (!doc) throw new Error('Document not found');

    if (doc.props.type !== 'youtube') {
      this.logger.log(
        `[TranscriptWorker] Skipping non-youtube document: ${documentId}`,
      );
      return;
    }

    const existingTranscript = await DocumentTranscriptModel.findOne()
      .where('documentId')
      .equals(documentId)
      .exec();
    if (existingTranscript) {
      this.logger.log(
        `[TranscriptWorker] Transcript already exists for: ${documentId}`,
      );
      return;
    }

    if (!doc.props.sourceUrl) {
      throw new Error('No sourceUrl found for video transcript generation');
    }

    const result = await youtubeExtractor.extractYouTube(doc.props.sourceUrl);
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

    // We now have the text, chunk and embed it to Qdrant so it becomes searchable
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
            type: doc.props.type,
            status: doc.props.status,
          },
        },
      ]);

      // Save chunk ref back to mongo
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
