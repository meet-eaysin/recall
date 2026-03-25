'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { libraryApi } from '../api';
import type { DocumentFilters } from '../types';

export function useDocuments(filters: DocumentFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.LIBRARY.documents(filters),
    queryFn: () => libraryApi.getDocuments(filters),
  });
}

export function useDocument(id: string) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: QUERY_KEYS.LIBRARY.document(id),
    queryFn: () => libraryApi.getDocument(id),
  });
}

export function useDocumentIngestion(id: string) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: QUERY_KEYS.LIBRARY.documentIngestion(id),
    queryFn: () => libraryApi.getIngestionStatus(id),
    refetchInterval: (query) => {
      const status = query.state.data?.ingestionStatus;
      return status && status !== 'completed' && status !== 'failed'
        ? 5000
        : false;
    },
  });
}

export function useDocumentTranscript(id: string, enabled = true) {
  return useQuery({
    enabled: Boolean(id) && enabled,
    queryKey: QUERY_KEYS.LIBRARY.documentTranscript(id),
    queryFn: () => libraryApi.getTranscript(id),
    retry: false,
  });
}

export function useFolders() {
  return useQuery({
    queryKey: QUERY_KEYS.LIBRARY.folders(),
    queryFn: libraryApi.getFolders,
  });
}

export function useNotes(documentId: string) {
  return useQuery({
    enabled: Boolean(documentId),
    queryKey: QUERY_KEYS.LIBRARY.notes(documentId),
    queryFn: () => libraryApi.getNotes(documentId),
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: libraryApi.createDocument,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LIBRARY.ROOT });
    },
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: libraryApi.createFolder,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LIBRARY.folders(),
      });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LIBRARY.ROOT });
    },
  });
}

export function useCreateNote(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: libraryApi.createNote,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LIBRARY.notes(documentId),
      });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: libraryApi.deleteDocument,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LIBRARY.ROOT });
    },
  });
}

export function useDeleteNote(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: libraryApi.deleteNote,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LIBRARY.notes(documentId),
      });
    },
  });
}

export function useDeleteSummary(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: libraryApi.deleteSummary,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LIBRARY.document(documentId),
      });
    },
  });
}

export function useGenerateSummary(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: libraryApi.generateSummary,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LIBRARY.document(documentId),
      });
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LIBRARY.documentIngestion(documentId),
      });
    },
  });
}

export function useGenerateTranscript(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: libraryApi.generateTranscript,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LIBRARY.documentTranscript(documentId),
      });
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LIBRARY.documentIngestion(documentId),
      });
    },
  });
}

export function useRetryIngestion(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: libraryApi.retryIngestion,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LIBRARY.documentIngestion(documentId),
      });
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LIBRARY.document(documentId),
      });
    },
  });
}

export function useUpdateDocument(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof libraryApi.updateDocument>[1]) =>
      libraryApi.updateDocument(documentId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LIBRARY.document(documentId),
      });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LIBRARY.ROOT });
    },
  });
}

export function useUpdateNote(documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ content, id }: { content: string; id: string }) =>
      libraryApi.updateNote(id, content),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LIBRARY.notes(documentId),
      });
    },
  });
}

export function useUpdateFolder(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { name?: string; color?: string; description?: string }) =>
      libraryApi.updateFolder(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LIBRARY.folders(),
      });
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LIBRARY.ROOT,
      });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: libraryApi.deleteFolder,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LIBRARY.folders(),
      });
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LIBRARY.ROOT,
      });
    },
  });
}
