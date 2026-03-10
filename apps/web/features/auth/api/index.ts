import type { AuthSessionView } from '@repo/types';
import { apiGet, apiPost, API_BASE_URL } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export type DevLoginInput = {
  authId?: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
};

export type OAuthProvider = 'google' | 'github';

export const authApi = {
  getSession: () => apiGet<AuthSessionView>(API_ENDPOINTS.AUTH.SESSION),
  devLogin: (body: DevLoginInput) =>
    apiPost<AuthSessionView>(API_ENDPOINTS.AUTH.DEV_LOGIN, { body }),
  refresh: () => apiPost<AuthSessionView>(API_ENDPOINTS.AUTH.REFRESH),
  logout: () => apiPost<{ success: true }>(API_ENDPOINTS.AUTH.LOGOUT),
  logoutAll: () => apiPost<{ success: true }>(API_ENDPOINTS.AUTH.LOGOUT_ALL),
  buildOAuthUrl: (provider: OAuthProvider) =>
    `${API_BASE_URL}/auth/${provider}`,
};
