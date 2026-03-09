'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { graphApi } from '../api';

export function useFullGraph() {
  return useQuery({
    queryKey: QUERY_KEYS.GRAPH.full(),
    queryFn: graphApi.getFullGraph,
  });
}

export function useDocumentSubgraph(documentId: string | null) {
  return useQuery({
    enabled: Boolean(documentId),
    queryKey: QUERY_KEYS.GRAPH.document(documentId ?? ''),
    queryFn: () => graphApi.getDocumentSubgraph(documentId ?? ''),
  });
}

export function useRebuildDocumentGraph() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: graphApi.rebuildDocumentGraph,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GRAPH.ROOT });
    },
  });
}
