import { TEST_USER_ID } from './common';
import { ReviewItem, RecommendationResult } from '@repo/types';

export interface DailyReviewResponse {
  success: boolean;
  items: ReviewItem[];
}

export interface RecommendationResponse {
  success: boolean;
  ownedDocuments: RecommendationResult['ownedDocuments'];
  suggestedTopics: RecommendationResult['suggestedTopics'];
}

export function isDailyReviewResponse(body: unknown): body is DailyReviewResponse {
  const b = body as DailyReviewResponse;
  return (
    typeof b === 'object' &&
    b !== null &&
    b.success === true &&
    Array.isArray(b.items)
  );
}

export function isRecommendationResponse(body: unknown): body is RecommendationResponse {
  const b = body as RecommendationResponse;
  return (
    typeof b === 'object' &&
    b !== null &&
    b.success === true &&
    Array.isArray(b.ownedDocuments) &&
    Array.isArray(b.suggestedTopics)
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
