'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { settingsApi } from '../api';

export function useCurrentUser() {
  return useQuery({
    queryKey: QUERY_KEYS.USERS.me(),
    queryFn: settingsApi.getUser,
  });
}

export function useCurrentSession() {
  return useQuery({
    queryKey: QUERY_KEYS.AUTH.SESSION,
    queryFn: settingsApi.getSession,
  });
}

export function useUserSessions() {
  return useQuery({
    queryKey: QUERY_KEYS.USERS.sessions(),
    queryFn: settingsApi.getUserSessions,
  });
}

export function useRevokeUserSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: settingsApi.revokeUserSession,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.USERS.sessions(),
      });
    },
  });
}

export function useLLMConfig() {
  return useQuery({
    retry: false,
    queryKey: QUERY_KEYS.SETTINGS.llm(),
    queryFn: settingsApi.getLLMConfig,
  });
}

export function useSaveLLMConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: settingsApi.saveLLMConfig,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SETTINGS.llm(),
      });
    },
  });
}

export function useValidateLLMConfig() {
  return useMutation({
    mutationFn: settingsApi.validateLLMConfig,
  });
}

export function useDeleteLLMConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: settingsApi.deleteLLMConfig,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SETTINGS.llm(),
      });
    },
  });
}

export function useNotionConfig() {
  return useQuery({
    retry: false,
    queryKey: QUERY_KEYS.SETTINGS.notionConfig(),
    queryFn: settingsApi.getNotionConfig,
  });
}

export function useNotionDatabases(enabled: boolean) {
  return useQuery({
    enabled,
    retry: false,
    queryKey: QUERY_KEYS.SETTINGS.notionDatabases(),
    queryFn: settingsApi.getNotionDatabases,
  });
}

export function useConnectNotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: settingsApi.connectNotion,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SETTINGS.notionConfig(),
      });
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SETTINGS.notionDatabases(),
      });
    },
  });
}

export function useUpdateNotionConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: settingsApi.updateNotionConfig,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SETTINGS.notionConfig(),
      });
    },
  });
}

export function useSyncNotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: settingsApi.syncNotion,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SETTINGS.notionConfig(),
      });
    },
  });
}

export function useDisconnectNotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: settingsApi.disconnectNotion,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SETTINGS.notionConfig(),
      });
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SETTINGS.notionDatabases(),
      });
    },
  });
}
