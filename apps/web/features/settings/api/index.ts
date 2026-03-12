import type {
  AuthSessionView,
  LLMConfigPublicView,
  NotionConfigPublicView,
  NotionDatabase,
  NotionSyncDirectionType,
  NotionSyncResult,
  UserPublicView,
  UserSessionView,
} from '@repo/types';
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export type SaveLLMConfigInput = {
  apiKey?: string;
  baseUrl?: string;
  chatModel: string;
  embeddingModel: string;
  provider: 'openai' | 'anthropic' | 'ollama';
};

export type UpdateNotionConfigInput = {
  syncDirection?: NotionSyncDirectionType;
  syncEnabled?: boolean;
  targetDatabaseId?: string;
};

export const settingsApi = {
  connectNotion: (accessToken: string) =>
    apiPost<NotionConfigPublicView>(API_ENDPOINTS.NOTION.CONNECT, {
      body: { accessToken },
    }),
  deleteLLMConfig: () => apiDelete<void>(API_ENDPOINTS.LLM_CONFIG.ROOT),
  disconnectNotion: () => apiDelete<void>(API_ENDPOINTS.NOTION.CONFIG),
  getLLMConfig: () =>
    apiGet<LLMConfigPublicView>(API_ENDPOINTS.LLM_CONFIG.ROOT),
  getNotionConfig: () =>
    apiGet<NotionConfigPublicView>(API_ENDPOINTS.NOTION.CONFIG),
  getNotionDatabases: () =>
    apiGet<NotionDatabase[]>(API_ENDPOINTS.NOTION.DATABASES),
  getSession: () => apiGet<AuthSessionView>(API_ENDPOINTS.AUTH.SESSION),
  getUser: () => apiGet<UserPublicView>(API_ENDPOINTS.USERS.ME),
  getUserSessions: () =>
    apiGet<UserSessionView[]>(API_ENDPOINTS.USERS.SESSIONS),
  revokeUserSession: (sessionId: string) =>
    apiDelete<{ success: boolean }>(API_ENDPOINTS.USERS.session(sessionId)),
  saveLLMConfig: (body: SaveLLMConfigInput) =>
    apiPut<LLMConfigPublicView>(API_ENDPOINTS.LLM_CONFIG.ROOT, { body }),
  syncNotion: () => apiPost<NotionSyncResult>(API_ENDPOINTS.NOTION.SYNC),
  updateNotionConfig: (body: UpdateNotionConfigInput) =>
    apiPatch<NotionConfigPublicView>(API_ENDPOINTS.NOTION.CONFIG, { body }),
  validateLLMConfig: (body: SaveLLMConfigInput) =>
    apiPost<LLMConfigPublicView>(API_ENDPOINTS.LLM_CONFIG.VALIDATE, { body }),
};
