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
  REVIEW: {
    DAILY: '/review/daily',
    RECOMMENDATIONS: '/review/recommendations',
    dismiss: (id: string) => `/review/dismiss/${id}`,
  },
  ANALYTICS: {
    STATS: '/analytics/stats',
    HEATMAP: '/analytics/heatmap',
  },
  AUTH: {
    SESSION: '/auth/session',
    DEV_LOGIN: '/auth/dev/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    LOGOUT_ALL: '/auth/logout-all',
    OAUTH_URL: (provider: 'google' | 'github') => `/auth/${provider}`,
  },
  USERS: {
    ME: '/users/me',
    SESSIONS: '/users/me/sessions',
    session: (sessionId: string) => `/users/me/sessions/${sessionId}`,
  },
  LLM_SETTINGS: {
    ROOT: '/user/settings/llm',
    TEST: '/user/settings/llm/test',
  },
  NOTION: {
    CONFIG: '/notion/config',
    CONNECT: '/notion/connect',
    DATABASES: '/notion/databases',
    SYNC: '/notion/sync',
  },
  GRAPH: {
    FULL: '/graph',
    document: (id: string) => `/graph/document/${id}`,
    rebuild: (id: string) => `/graph/rebuild/${id}`,
  },
  LEGAL: {
    BASE: '/legal',
    PRIVACY_POLICY: '/legal/privacy-policy',
    COOKIE_POLICY: '/legal/cookie-policy',
    TERMS_OF_SERVICE: '/legal/terms-of-service',
    ACCEPT: '/legal/accept',
    CONSENT_STATUS: '/legal/consent-status',
  },
} as const;
