import { Module } from '@nestjs/common';
import { ReviewSelectorService } from './domain/services/review-selector.service';
import { GetDailyReviewUseCase } from './application/use-cases/get-daily-review.usecase';
import { DismissReviewUseCase } from './application/use-cases/dismiss-review.usecase';
import { GetRecommendationsUseCase } from './application/use-cases/get-recommendations.usecase';
import { ReviewController } from './interface/review.controller';
import { DocumentsModule } from '../documents/documents.module';
import { GraphModule } from '../graph/graph.module';

import { IReviewRepository } from './domain/repositories/review.repository';
import { MongooseReviewRepository } from './infrastructure/persistence/mongoose-review.repository';

@Module({
  imports: [DocumentsModule, GraphModule],
  controllers: [ReviewController],
  providers: [
    ReviewSelectorService,
    GetDailyReviewUseCase,
    DismissReviewUseCase,
    GetRecommendationsUseCase,
    {
      provide: IReviewRepository,
      useClass: MongooseReviewRepository,
    },
  ],
})
export class ReviewModule {}
