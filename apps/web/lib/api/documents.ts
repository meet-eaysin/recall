import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { PaginatedResponse } from '@repo/types';

export type DocumentRow = {
  id: string;
  title: string;
  source: string;
  type: string;
  status: string;
  updatedAt: string;
  tags?: string[];
  folderId?: string;
  sourceUrl?: string; // URL for daily.dev style clickthrough
};

type DocumentsListData = PaginatedResponse<DocumentRow>;

export function useDocuments(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['documents', page, limit],
    queryFn: () =>
      apiGet<DocumentsListData>(`/documents?page=${page}&limit=${limit}`),
  });
}
