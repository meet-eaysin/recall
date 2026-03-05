import { TEST_USER_ID, generateId } from './common';

export interface HeatmapResponse {
  success: boolean;
  data: {
    heatmap: Array<{
      date: string;
      count: number;
      breakdown: {
        doc_added: number;
        doc_opened: number;
        note_created: number;
        summary_generated: number;
      };
    }>;
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
  if (typeof body !== 'object' || body === null) return false;
  if (!('success' in body) || body.success !== true) return false;
  if (!('data' in body) || typeof body.data !== 'object' || body.data === null) return false;
  const data = body.data;
  return 'heatmap' in data && Array.isArray(data.heatmap);
}

export function isStatsResponse(body: unknown): body is StatsResponse {
  if (typeof body !== 'object' || body === null) return false;
  if (!('success' in body) || body.success !== true) return false;
  if (!('data' in body) || typeof body.data !== 'object' || body.data === null) return false;
  const data = body.data;
  return 'totalDocuments' in data && typeof data.totalDocuments === 'number';
}

export async function seedActivity(
  action: string,
  userId: string = TEST_USER_ID,
  date: Date = new Date(),
  targetType: string = 'document',
  targetId: string = generateId(),
): Promise<void> {
  const { UserActivityModel } = await import('@repo/db');
  const activity = new UserActivityModel({
    userId,
    action,
    targetType,
    targetId,
    metadata: {},
    createdAt: date,
    updatedAt: date,
  });
  await activity.save();
}
