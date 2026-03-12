import type { RecommendationResult, ReviewItem } from '@repo/types';
import { apiGet, apiPost } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export const homeApi = {
  dismissReview: (id: string) =>
    apiPost<void>(API_ENDPOINTS.REVIEW.dismiss(id)),
  getDailyReview: () => apiGet<ReviewItem[]>(API_ENDPOINTS.REVIEW.DAILY),
  getRecommendations: () =>
    apiGet<RecommendationResult>(API_ENDPOINTS.REVIEW.RECOMMENDATIONS),
};
