import {
  AnalyticsDocumentStatsAggregationResult,
  AnalyticsStatsAggregationResult,
} from '@repo/types';

export abstract class IUserActivityRepository {
  abstract getStats(userId: string): Promise<{
    totalDocuments: number;
    docsByType: AnalyticsDocumentStatsAggregationResult[];
    docsByStatus: AnalyticsDocumentStatsAggregationResult[];
    totalNotes: number;
    activityHistory: { _id: string; count: number }[];
    mostActiveDay: string | null;
  }>;
  abstract getHeatmap(
    userId: string,
    startDate: Date,
  ): Promise<AnalyticsStatsAggregationResult[]>;
  abstract recordActivity(data: {
    userId: string;
    targetId: string;
    targetType: string;
    action: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
}
