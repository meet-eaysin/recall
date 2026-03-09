import type { DocumentStatus, DocumentType } from '@repo/types';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import type {
  DocumentDetail,
  DocumentFilters,
  DocumentsListData,
  FolderDetails,
  FolderRow,
  IngestionStatusView,
  NoteRow,
} from '../types';

type UpdateDocumentInput = {
  folderId?: string;
  metadata?: Record<string, unknown>;
  status?: DocumentStatus;
  tagIds?: string[];
  title?: string;
};

function buildQueryString(
  params: Record<string, string | number | undefined | string[]>,
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item) searchParams.append(key, item);
      });
      return;
    }

    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export const libraryApi = {
  createDocument: (payload: {
    source: string;
    title?: string;
    type: DocumentType;
  }) =>
    apiPost<{ document: DocumentDetail }>(API_ENDPOINTS.DOCUMENTS.CREATE, {
      body: payload,
    }),

  createFolder: (payload: {
    color?: string;
    description?: string;
    name: string;
    parentId?: string;
  }) =>
    apiPost<{ folder: FolderRow }>(API_ENDPOINTS.KNOWLEDGE.FOLDERS.CREATE, {
      body: payload,
    }),

  createNote: (payload: { content: string; documentId: string }) =>
    apiPost<{ note: NoteRow }>(API_ENDPOINTS.KNOWLEDGE.NOTES.CREATE, {
      body: payload,
    }),

  deleteDocument: (id: string) =>
    apiDelete<void>(API_ENDPOINTS.DOCUMENTS.detail(id)),

  deleteNote: (id: string) =>
    apiDelete<void>(API_ENDPOINTS.KNOWLEDGE.NOTES.detail(id)),

  deleteSummary: (id: string) =>
    apiDelete<void>(API_ENDPOINTS.DOCUMENTS.summary(id)),

  generateSummary: (id: string) =>
    apiPost<{ message: string }>(API_ENDPOINTS.DOCUMENTS.summary(id)),

  generateTranscript: (id: string) =>
    apiPost<{ content: string }>(API_ENDPOINTS.DOCUMENTS.transcript(id)),

  getDocument: async (id: string) => {
    const response = await apiGet<{ document: DocumentDetail }>(
      API_ENDPOINTS.DOCUMENTS.detail(id),
    );
    return response.document;
  },

  getDocuments: (filters: DocumentFilters) => {
    const query = buildQueryString({
      folderIds: filters.folderIds,
      limit: filters.limit ?? 24,
      page: filters.page ?? 1,
      q: filters.q,
      status: filters.status,
      type: filters.type,
    });

    return apiGet<DocumentsListData>(`${API_ENDPOINTS.DOCUMENTS.LIST}${query}`);
  },

  getFolders: async () => {
    const response = await apiGet<{ folders: FolderRow[] }>(
      API_ENDPOINTS.KNOWLEDGE.FOLDERS.LIST,
    );
    return response.folders;
  },

  getFolderDetails: (id: string) =>
    apiGet<FolderDetails>(API_ENDPOINTS.KNOWLEDGE.FOLDERS.detail(id)),

  getFolderDocuments: (id: string, page = 1, limit = 20) => {
    const query = buildQueryString({ limit, page });
    return apiGet<DocumentsListData>(
      `${API_ENDPOINTS.KNOWLEDGE.FOLDERS.documents(id)}${query}`,
    );
  },

  getIngestionStatus: (id: string) =>
    apiGet<IngestionStatusView>(API_ENDPOINTS.DOCUMENTS.ingestionStatus(id)),

  getNotes: async (documentId: string) => {
    const query = buildQueryString({ documentId });
    const response = await apiGet<{ notes: NoteRow[] }>(
      `${API_ENDPOINTS.KNOWLEDGE.NOTES.LIST}${query}`,
    );
    return response.notes;
  },

  getTranscript: (id: string) =>
    apiGet<{ content: string }>(API_ENDPOINTS.DOCUMENTS.transcript(id)),

  retryIngestion: (id: string) =>
    apiPost<IngestionStatusView>(API_ENDPOINTS.DOCUMENTS.retryIngestion(id)),

  updateDocument: async (id: string, payload: UpdateDocumentInput) => {
    const response = await apiPatch<{ document: DocumentDetail }>(
      API_ENDPOINTS.DOCUMENTS.detail(id),
      {
        body: payload,
      },
    );
    return response.document;
  },

  updateNote: async (id: string, content: string) => {
    const response = await apiPatch<{ note: NoteRow }>(
      API_ENDPOINTS.KNOWLEDGE.NOTES.detail(id),
      {
        body: { content },
      },
    );
    return response.note;
  },
};
