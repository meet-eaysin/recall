import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue, Queue } from '@repo/queue';
import { IngestionStatus, SummaryJobData, QUEUE_SUMMARY } from '@repo/types';
import { IDocumentRepository } from '../../domain/repositories/document.repository';

@Injectable()
export class SummaryUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    @InjectQueue(QUEUE_SUMMARY)
    private readonly summaryQueue: Queue<SummaryJobData>,
  ) {}

  async generateSummary(documentId: string, userId: string): Promise<void> {
    const doc = await this.documentRepository.findById(documentId, userId);
    if (!doc) throw new NotFoundException('Document not found');

    if (doc.ingestionStatus !== IngestionStatus.COMPLETED) {
      throw new BadRequestException('Document ingestion is not completed yet');
    }

    await this.summaryQueue.add('summary', { documentId, userId });
  }

  async deleteSummary(documentId: string, userId: string): Promise<void> {
    const doc = await this.documentRepository.findById(documentId, userId);
    if (!doc) throw new NotFoundException('Document not found');

    await this.documentRepository.update(documentId, userId, {
      summary: undefined,
    });
  }
}
