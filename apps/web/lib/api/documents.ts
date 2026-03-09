import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type {
  DocumentType,
  DocumentStatus,
  SourceType,
  PaginatedResponse,
} from '@repo/types';

export interface DocumentRow {
  id: string;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  sourceType: SourceType;
  sourceUrl?: string;
  tags: string[];
  folderId?: string;
  lastOpenedAt?: string;
  createdAt: string;
  updatedAt: string;
}

type DocumentsListData = PaginatedResponse<DocumentRow>;

export function useDocuments(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['documents', page, limit],
    queryFn: () =>
      apiGet<DocumentsListData>(`/documents?page=${page}&limit=${limit}`),
  });
}
