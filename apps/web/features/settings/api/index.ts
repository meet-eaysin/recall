import type {
  AuthSessionView,
  LLMSettingsResponse,
  TestLLMConfigRequest,
  NotionConfigPublicView,
  NotionDatabase,
  NotionSyncResult,
  NotionSyncDirectionType,
  UserPublicView,
  UserSessionView,
  UpdateLLMConfigRequest,
} from '@repo/types';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

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
  disconnectNotion: () => apiDelete<void>(API_ENDPOINTS.NOTION.CONFIG),
  getLLMConfig: () =>
    apiGet<LLMSettingsResponse>(API_ENDPOINTS.LLM_SETTINGS.ROOT),
  getNotionConfig: () =>
    apiGet<NotionConfigPublicView>(API_ENDPOINTS.NOTION.CONFIG),
  getNotionDatabases: () =>
    apiGet<NotionDatabase[]>(API_ENDPOINTS.NOTION.DATABASES),
  getSession: () => apiGet<AuthSessionView>(API_ENDPOINTS.AUTH.SESSION),
  getUser: () => apiGet<UserPublicView>(API_ENDPOINTS.USERS.ME),
  getUserSessions: () =>
    apiGet<UserSessionView[]>(API_ENDPOINTS.USERS.SESSIONS),
  updateUser: (body: Partial<UserPublicView>) =>
    apiPatch<UserPublicView>(API_ENDPOINTS.USERS.ME, { body }),
  revokeUserSession: (sessionId: string) =>
    apiDelete<{ success: boolean }>(API_ENDPOINTS.USERS.session(sessionId)),
  updateLLMConfig: (body: UpdateLLMConfigRequest) =>
    apiPatch<{ success: boolean; message: string }>(
      API_ENDPOINTS.LLM_SETTINGS.ROOT,
      { body },
    ),
  syncNotion: () => apiPost<NotionSyncResult>(API_ENDPOINTS.NOTION.SYNC),
  updateNotionConfig: (body: UpdateNotionConfigInput) =>
    apiPatch<NotionConfigPublicView>(API_ENDPOINTS.NOTION.CONFIG, { body }),
  testLLMConfig: (body: TestLLMConfigRequest) =>
    apiPost<{ success: boolean; message: string; response?: string }>(
      API_ENDPOINTS.LLM_SETTINGS.TEST,
      { body },
    ),
};
