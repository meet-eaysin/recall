import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { DevUserGuard } from '../../../shared/guards/dev-user.guard';
import { GetDailyReviewUseCase } from '../application/use-cases/get-daily-review.usecase';
import { DismissReviewUseCase } from '../application/use-cases/dismiss-review.usecase';
import { GetRecommendationsUseCase } from '../application/use-cases/get-recommendations.usecase';
import { User } from '../../../shared/decorators/user.decorator';
import {
  ReviewItemDto,
  ReviewRecommendationDto,
} from './dtos/review.response.dto';
import { ApiSuccessResponse } from 'src/shared/decorators/api-success-response.decorator';

@ApiTags('Spaced Repetition Review')
@ApiBearerAuth('bearerAuth')
@Controller('review')
@UseGuards(DevUserGuard)
export class ReviewController {
  constructor(
    private readonly getDailyReviewUseCase: GetDailyReviewUseCase,
    private readonly dismissReviewUseCase: DismissReviewUseCase,
    private readonly getRecommendationsUseCase: GetRecommendationsUseCase,
  ) {}

  @Get('daily')
  @ApiOperation({ summary: 'Get documents due for daily review' })
  @ApiSuccessResponse(ReviewItemDto, 'Daily review items', true)
  async getDailyReview(@User('userId') userId: string) {
    const items = await this.getDailyReviewUseCase.execute(userId);
    return items;
  }

  @Post('dismiss/:docId')
  @ApiOperation({ summary: 'Dismiss a document from current review session' })
  @ApiParam({ name: 'docId', description: 'Document UUID' })
  @ApiSuccessResponse(undefined, 'Review dismissed')
  async dismissReview(
    @Param('docId') docId: string,
    @User('userId') userId: string,
  ) {
    await this.dismissReviewUseCase.execute(docId, userId);
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get AI-powered document recommendations' })
  @ApiSuccessResponse(ReviewRecommendationDto)
  async getRecommendations(@User('userId') userId: string) {
    const result = await this.getRecommendationsUseCase.execute(userId);
    return result;
  }
}
