import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { QStashService } from '@repo/queue';
import { IDocumentRepository } from '../../domain/repositories/document.repository';
import {
  IngestionStatus,
  QUEUE_INGESTION,
} from '@repo/types';

@Injectable()
export class RetryIngestionUseCase {
  private readonly logger = new Logger(RetryIngestionUseCase.name);

  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly qstashService: QStashService,
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

    // Re-push to ingestion webhook
    this.qstashService
      .publishMessage(QUEUE_INGESTION, {
        documentId: id,
        userId: userId,
        type: doc.type,
        source: doc.sourceUrl ?? '',
      })
      .catch((err: Error) => {
        this.logger.error(`Failed to publish to QStash: ${err.message}`);
      });

    return { jobId: `dummy-job-${id}` };
  }
}
