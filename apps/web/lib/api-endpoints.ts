export const API_ENDPOINTS = {
  DOCUMENTS: {
    LIST: '/documents',
    CREATE: '/documents',
    UPLOAD: '/documents/upload',
    detail: (id: string) => `/documents/${id}`,
    ingestionStatus: (id: string) => `/documents/${id}/ingestion-status`,
    retryIngestion: (id: string) => `/documents/${id}/retry-ingestion`,
    summary: (id: string) => `/documents/${id}/summary`,
    transcript: (id: string) => `/documents/${id}/transcript`,
  },
  KNOWLEDGE: {
    FOLDERS: {
      LIST: '/knowledge/folders',
      CREATE: '/knowledge/folders',
      detail: (id: string) => `/knowledge/folders/${id}`,
      documents: (id: string) => `/knowledge/folders/${id}/documents`,
    },
    TAGS: {
      LIST: '/knowledge/tags',
      CREATE: '/knowledge/tags',
      detail: (id: string) => `/knowledge/tags/${id}`,
      documents: (id: string) => `/knowledge/tags/${id}/documents`,
    },
    NOTES: {
      LIST: '/knowledge/notes',
      CREATE: '/knowledge/notes',
      detail: (id: string) => `/knowledge/notes/${id}`,
    },
  },
  SEARCH: {
    LIST: '/search',
    ASK: '/search/ask',
    ASK_STREAM: '/search/ask/stream',
    CHATS: '/search/chats',
    chat: (id: string) => `/search/chats/${id}`,
  },
} as const;
