import type { DocumentFilters } from '@/features/library/types';

export const QUERY_KEYS = {
  AUTH: {
    SESSION: ['auth', 'session'] as const,
  },
  LIBRARY: {
    ROOT: ['library'] as const,
    documents: (filters: DocumentFilters) =>
      ['library', 'documents', filters] as const,
    document: (id: string) => ['library', 'document', id] as const,
    documentIngestion: (id: string) =>
      ['library', 'document', id, 'ingestion'] as const,
    documentTranscript: (id: string) =>
      ['library', 'document', id, 'transcript'] as const,
    folders: () => ['library', 'folders'] as const,
    folderDocuments: (id: string, page: number, limit: number) =>
      ['library', 'folders', id, 'documents', page, limit] as const,
    notes: (documentId: string) =>
      ['library', 'document', documentId, 'notes'] as const,
  },
} as const;
