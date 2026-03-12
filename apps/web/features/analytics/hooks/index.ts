'use client';

import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { analyticsApi } from '../api';
import type { AnalyticsHeatmapResponse, AnalyticsStatsResponse } from '../api';

export function useAnalyticsStats(): UseQueryResult<AnalyticsStatsResponse> {
  return useQuery<AnalyticsStatsResponse>({
    queryKey: QUERY_KEYS.ANALYTICS.stats(),
    queryFn: analyticsApi.getStats,
  });
}

export function useAnalyticsHeatmap(
  days = 90,
): UseQueryResult<AnalyticsHeatmapResponse> {
  return useQuery<AnalyticsHeatmapResponse>({
    queryKey: QUERY_KEYS.ANALYTICS.heatmap(days),
    queryFn: () => analyticsApi.getHeatmap(days),
  });
}
