import { TEST_USER_ID } from './common';
import { ReviewItem, RecommendationResult } from '@repo/types';

import { isObject } from './common';

export interface DailyReviewResponse {
  success: boolean;
  data: ReviewItem[];
}

export interface RecommendationResponse {
  success: boolean;
  data: RecommendationResult;
}

export function isDailyReviewResponse(
  body: unknown,
): body is DailyReviewResponse {
  if (!isObject(body)) return false;
  if (body.success !== true) return false;
  return Array.isArray(body.data);
}

export function isRecommendationResponse(
  body: unknown,
): body is RecommendationResponse {
  if (!isObject(body)) return false;
  if (body.success !== true) return false;
  if (!isObject(body.data)) return false;

  const data = body.data;
  return (
    Array.isArray(data.ownedDocuments) && Array.isArray(data.suggestedTopics)
  );
}

export async function seedReviewDismissal(
  targetId: string,
  targetType: 'document' | 'note' | 'graph-node' = 'document',
): Promise<void> {
  const { ReviewDismissalModel } = await import('@repo/db');
  const { Types } = await import('mongoose');

  const today = new Date().toISOString().split('T')[0] ?? '';

  await new ReviewDismissalModel({
    userId: new Types.ObjectId(TEST_USER_ID),
    targetId: new Types.ObjectId(targetId),
    targetType,
    date: today,
  }).save();
}
