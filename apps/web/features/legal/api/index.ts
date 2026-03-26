import { apiGet, apiPost } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import type {
  LegalDocument,
  ConsentStatus,
  AcceptConsentDto,
} from '@repo/types';

export const legalApi = {
  getPolicy: (type: 'privacy' | 'cookie') => {
    const endpoint =
      type === 'privacy'
        ? API_ENDPOINTS.LEGAL.PRIVACY_POLICY
        : API_ENDPOINTS.LEGAL.COOKIE_POLICY;
    return apiGet<LegalDocument>(endpoint);
  },

  getTermsOfService: () =>
    apiGet<LegalDocument>(API_ENDPOINTS.LEGAL.TERMS_OF_SERVICE),

  getConsentStatus: (params: { userId?: string; anonymousId?: string }) => {
    const query = new URLSearchParams();
    if (params.userId) query.append('userId', params.userId);
    if (params.anonymousId) query.append('anonymousId', params.anonymousId);
    return apiGet<ConsentStatus>(
      `${API_ENDPOINTS.LEGAL.CONSENT_STATUS}?${query.toString()}`,
    );
  },

  acceptConsent: (dto: AcceptConsentDto, params: { anonymousId?: string }) => {
    const query = new URLSearchParams();
    if (params.anonymousId) query.append('anonymousId', params.anonymousId);
    return apiPost<ConsentStatus>(
      `${API_ENDPOINTS.LEGAL.ACCEPT}?${query.toString()}`,
      { body: dto },
    );
  },
};
