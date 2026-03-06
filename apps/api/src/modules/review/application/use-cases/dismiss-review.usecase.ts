import { Injectable, NotFoundException } from '@nestjs/common';
import { IDocumentRepository } from '../../../documents/domain/repositories/document.repository';
import { IReviewRepository } from '../../domain/repositories/review.repository';

@Injectable()
export class DismissReviewUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly reviewRepository: IReviewRepository,
  ) {}

  async execute(documentId: string, userId: string): Promise<void> {
    const doc = await this.documentRepository.findById(documentId, userId);
    if (!doc) {
      throw new NotFoundException(
        'Document not found or does not belong to user',
      );
    }

    const today = new Date().toISOString().split('T')[0] ?? '';

    await this.reviewRepository.dismiss(userId, documentId, 'document', today);
  }
}
