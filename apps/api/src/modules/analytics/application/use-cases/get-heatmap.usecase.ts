import { Injectable } from '@nestjs/common';
import type {
  AnalyticsHeatmapItem,
  AnalyticsStatsAggregationResult,
  AnalyticsBreakdown,
} from '@repo/types';
import { IUserActivityRepository } from '../../domain/repositories/user-activity.repository';

@Injectable()
export class GetHeatmapUseCase {
  constructor(
    private readonly userActivityRepository: IUserActivityRepository,
  ) {}

  async execute(
    userId: string,
    days: number = 365,
  ): Promise<{ heatmap: AnalyticsHeatmapItem[] }> {
    const startDate = new Date();
    startDate.setUTCHours(0, 0, 0, 0);
    startDate.setUTCDate(startDate.getUTCDate() - days);

    const aggregation = await this.userActivityRepository.getHeatmap(
      userId,
      startDate,
    );

    const statsMap = new Map<
      string,
      { count: number; breakdown: AnalyticsBreakdown }
    >();

    aggregation.forEach((item: AnalyticsStatsAggregationResult) => {
      const dateStr: string = item._id;
      statsMap.set(dateStr, {
        count: item.count,
        breakdown: {
          doc_added: item.doc_added,
          doc_opened: item.doc_opened,
          note_created: item.note_created,
          summary_generated: item.summary_generated,
        },
      });
    });

    const heatmap: AnalyticsHeatmapItem[] = [];

    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setUTCDate(date.getUTCDate() + i);
      const dateStr = date.toISOString().split('T')[0] ?? '';

      const existing = statsMap.get(dateStr);
      heatmap.push({
        date: dateStr,
        count: existing?.count ?? 0,
        breakdown: existing?.breakdown ?? {
          doc_added: 0,
          doc_opened: 0,
          note_created: 0,
          summary_generated: 0,
        },
      });
    }

    return { heatmap };
  }
}
