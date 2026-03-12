'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { toast } from 'sonner';
import { searchApi } from '../api';
import { ApiError } from '@/lib/api';
import type { SearchFilters } from '../types';

export function useSearchResults(filters: SearchFilters, enabled = true) {
  return useQuery({
    enabled,
    queryKey: QUERY_KEYS.SEARCH.results(filters),
    queryFn: () => searchApi.search(filters),
  });
}

export function useSearchChats(includeArchived = false) {
  return useQuery({
    queryKey: QUERY_KEYS.SEARCH.chats(includeArchived),
    queryFn: () => searchApi.getChats(includeArchived),
  });
}

export function useDeleteChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: searchApi.deleteChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SEARCH.chats() });
      toast.success('Conversation deleted');
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Failed to delete conversation';
      toast.error(message);
    },
  });
}

export function useArchiveChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isArchived }: { id: string; isArchived: boolean }) =>
      searchApi.archiveChat(id, isArchived),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SEARCH.chats() });
      toast.success(
        variables.isArchived
          ? 'Conversation archived'
          : 'Conversation unarchived',
      );
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Failed to archive conversation';
      toast.error(message);
    },
  });
}

export function useClearHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: searchApi.clearHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SEARCH.chats() });
      toast.success('Chat history cleared');
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Failed to clear chat history';
      toast.error(message);
    },
  });
}

export function useSearchChat(conversationId: string | null) {
  return useQuery({
    enabled: Boolean(conversationId),
    queryKey: QUERY_KEYS.SEARCH.chat(conversationId ?? ''),
    queryFn: () => searchApi.getChat(conversationId ?? ''),
  });
}
