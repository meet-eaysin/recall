import { isObject, TEST_USER_ID } from './common';
import type { AnalyticsHeatmapItem } from '@repo/types';

export interface HeatmapResponse {
  success: boolean;
  data: {
    heatmap: AnalyticsHeatmapItem[];
  };
}

export interface StatsResponse {
  success: boolean;
  data: {
    totalDocuments: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    totalNotes: number;
    currentStreak: number;
    longestStreak: number;
    mostActiveDay: string | null;
  };
}

export function isHeatmapResponse(body: unknown): body is HeatmapResponse {
  if (!isObject(body)) return false;
  if (body.success !== true) return false;
  if (!isObject(body.data)) return false;
  return Array.isArray(body.data.heatmap);
}

export function isStatsResponse(body: unknown): body is StatsResponse {
  if (!isObject(body)) return false;
  if (body.success !== true) return false;
  if (!isObject(body.data)) return false;
  return typeof body.data.totalDocuments === 'number';
}

export async function seedActivity(
  action: string,
  userId: string = TEST_USER_ID,
  createdAt: Date = new Date(),
): Promise<void> {
  const { UserActivityModel } = await import('@repo/db');
  const { Types } = await import('mongoose');

  await new UserActivityModel({
    userId,
    action,
    targetType: 'document',
    targetId: new Types.ObjectId(),
    createdAt,
    metadata: {},
  }).save();
}
