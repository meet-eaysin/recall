import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GetHeatmapUseCase } from '../../application/use-cases/get-heatmap.usecase';
import { GetStatsUseCase } from '../../application/use-cases/get-stats.usecase';
import { DevUserGuard } from '../../../../shared/guards/dev-user.guard';
import { User } from '../../../../shared/decorators/user.decorator';
import {
  AnalyticsStatsResponseDto,
  AnalyticsHeatmapItemDto,
} from '../dtos/analytics.response.dto';
import { ApiSuccessResponse } from 'src/shared/decorators/api-success-response.decorator';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(DevUserGuard)
export class AnalyticsController {
  constructor(
    private readonly getHeatmapUseCase: GetHeatmapUseCase,
    private readonly getStatsUseCase: GetStatsUseCase,
  ) {}

  @Get('heatmap')
  @ApiOperation({ summary: 'Get activity heatmap data for the user' })
  @ApiSuccessResponse(
    AnalyticsHeatmapItemDto,
    'Heatmap data retrieved successfully',
    true,
  )
  async getHeatmap(
    @User('userId') userId: string,
    @Query('days') days?: string,
  ) {
    const daysInt = days ? parseInt(days, 10) : 365;
    const data = await this.getHeatmapUseCase.execute(userId, daysInt);
    return data;
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user engagement statistics and streaks' })
  @ApiSuccessResponse(AnalyticsStatsResponseDto)
  async getStats(@User('userId') userId: string) {
    const stats = await this.getStatsUseCase.execute(userId);
    return stats;
  }
}
