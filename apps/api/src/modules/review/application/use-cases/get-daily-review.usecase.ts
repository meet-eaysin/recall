import { Injectable } from '@nestjs/common';
import { ReviewSelectorService } from '../../domain/services/review-selector.service';
import { IDocumentRepository } from '../../../documents/domain/repositories/document.repository';
import { IGraphRepository } from '../../../graph/domain/repositories/graph.repository';
import { IReviewRepository } from '../../domain/repositories/review.repository';
import type { ReviewItem } from '@repo/types';
import { DocumentEntity } from '../../../documents/domain/entities/document.entity';

@Injectable()
export class GetDailyReviewUseCase {
  constructor(
    private readonly reviewSelector: ReviewSelectorService,
    private readonly documentRepository: IDocumentRepository,
    private readonly graphRepository: IGraphRepository,
    private readonly reviewRepository: IReviewRepository,
  ) {}

  async execute(userId: string): Promise<ReviewItem[]> {
    const today = new Date().toISOString().split('T')[0] ?? '';

    // 1. Fetch dismissed doc IDs via repository
    const dismissedDocIds = await this.reviewRepository.findDismissedTargetIds(
      userId,
      today,
      'document',
    );

    // 2. Fetch all user documents
    const { docs: allDocs } = await this.documentRepository.findAll(userId, {
      page: 1,
      limit: 1000,
    });

    // 3. Fetch graph edges
    const allEdges = await this.graphRepository.findAllEdges(userId);
    const graphEdges = allEdges.map((e) => e.toView());

    // 4. Fetch recently opened docs (last 3)
    const recentlyOpened = [...allDocs]
      .filter((d: DocumentEntity) => d.props.lastOpenedAt)
      .sort(
        (a: DocumentEntity, b: DocumentEntity) =>
          (b.props.lastOpenedAt?.getTime() ?? 0) -
          (a.props.lastOpenedAt?.getTime() ?? 0),
      )
      .slice(0, 3)
      .map((d: DocumentEntity) => d.id);

    // 5. Fetch docs with notes via repository
    const recentNoteDocIds =
      await this.reviewRepository.findDocumentIdsWithNotes(userId);

    return this.reviewSelector.selectDailyReview({
      documents: allDocs,
      graphEdges,
      recentlyOpenedDocIds: recentlyOpened,
      dismissedDocIds,
      recentNoteDocIds,
    });
  }
}
