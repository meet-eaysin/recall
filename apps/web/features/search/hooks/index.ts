'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { searchApi } from '../api';
import type { SearchFilters } from '../types';

export function useSearchResults(filters: SearchFilters, enabled = true) {
  return useQuery({
    enabled,
    queryKey: QUERY_KEYS.SEARCH.results(filters),
    queryFn: () => searchApi.search(filters),
  });
}

export function useSearchChats() {
  return useQuery({
    queryKey: QUERY_KEYS.SEARCH.chats(),
    queryFn: searchApi.getChats,
  });
}

export function useSearchChat(conversationId: string | null) {
  return useQuery({
    enabled: Boolean(conversationId),
    queryKey: QUERY_KEYS.SEARCH.chat(conversationId ?? ''),
    queryFn: () => searchApi.getChat(conversationId ?? ''),
  });
}
