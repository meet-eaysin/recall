import { Injectable } from '@nestjs/common';
import type { AnalyticsDocumentStatsAggregationResult } from '@repo/types';
import { IUserActivityRepository } from '../../domain/repositories/user-activity.repository';

@Injectable()
export class GetStatsUseCase {
  constructor(
    private readonly userActivityRepository: IUserActivityRepository,
  ) {}

  async execute(userId: string) {
    const stats = await this.userActivityRepository.getStats(userId);

    const {
      totalDocuments,
      docsByType,
      docsByStatus,
      totalNotes,
      activityHistory,
      mostActiveDay,
    } = stats;

    const byType: Record<string, number> = {};
    docsByType.forEach((item: AnalyticsDocumentStatsAggregationResult) => {
      byType[item._id] = item.count;
    });

    const byStatus: Record<string, number> = {};
    docsByStatus.forEach((item: AnalyticsDocumentStatsAggregationResult) => {
      byStatus[item._id] = item.count;
    });

    const activeDates: string[] = activityHistory.map(
      (item: { _id: string }) => item._id,
    );
    const { currentStreak, longestStreak } =
      this.calculateStreakDetails(activeDates);

    return {
      totalDocuments,
      byType,
      byStatus,
      totalNotes,
      currentStreak,
      longestStreak,
      mostActiveDay,
    };
  }

  private calculateStreakDetails(activeDates: string[]): {
    currentStreak: number;
    longestStreak: number;
  } {
    if (activeDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const today = new Date().toISOString().split('T')[0] ?? '';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0] ?? '';

    let currentStreak = 0;
    const checkDate = activeDates.includes(today)
      ? today
      : activeDates.includes(yesterdayStr)
        ? yesterdayStr
        : null;

    if (checkDate) {
      const tempDate = new Date(checkDate);
      while (activeDates.includes(tempDate.toISOString().split('T')[0] ?? '')) {
        currentStreak++;
        tempDate.setDate(tempDate.getDate() - 1);
      }
    }

    let longestStreak = 0;
    let currentTempStreak = 0;

    const sortedDates = [...activeDates].sort();
    let prevDate: Date | null = null;

    for (const dateStr of sortedDates) {
      const currentDate = new Date(dateStr);
      if (prevDate) {
        const diff =
          (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          currentTempStreak++;
        } else {
          currentTempStreak = 1;
        }
      } else {
        currentTempStreak = 1;
      }
      longestStreak = Math.max(longestStreak, currentTempStreak);
      prevDate = currentDate;
    }

    return { currentStreak, longestStreak };
  }
}
