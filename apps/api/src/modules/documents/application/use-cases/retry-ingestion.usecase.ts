import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { IDocumentRepository } from '../../domain/repositories/document.repository';
import {
  IngestionStatus,
  IngestionJobData,
  QUEUE_INGESTION,
} from '@repo/types';

@Injectable()
export class RetryIngestionUseCase {
  private readonly logger = new Logger(RetryIngestionUseCase.name);

  constructor(
    private readonly documentRepository: IDocumentRepository,
    @InjectQueue(QUEUE_INGESTION)
    private readonly ingestionQueue: Queue<IngestionJobData>,
  ) {}

  async execute(id: string, userId: string): Promise<{ jobId: string }> {
    const doc = await this.documentRepository.findById(id, userId);

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    const canRetry =
      doc.ingestionStatus === IngestionStatus.FAILED && !doc.embeddingsReady;

    if (!canRetry) {
      throw new UnprocessableEntityException(
        'Retry is only available for failed document ingestions',
      );
    }

    await this.documentRepository.update(id, userId, {
      ingestionStatus: IngestionStatus.PENDING,
      ingestionError: null,
    });

    // Re-push to ingestion queue
    this.ingestionQueue
      .add('process', {
        documentId: id,
        userId: userId,
        type: doc.type,
        source: doc.sourceUrl ?? '',
      })
      .catch((err: Error) => {
        this.logger.error(`Failed to re-push job: ${err.message}`);
      });

    return { jobId: `dummy-job-${id}` };
  }
}
