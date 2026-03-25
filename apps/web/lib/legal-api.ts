import { API_ENDPOINTS } from './api-endpoints';
import { apiGet, apiPost } from './api';
import type { AcceptConsentDto, ConsentStatus, LegalDocument } from '@repo/types';

export const fetchPrivacyPolicy = async (): Promise<LegalDocument> => {
  return apiGet<LegalDocument>(API_ENDPOINTS.LEGAL.PRIVACY_POLICY);
};

export const fetchCookiePolicy = async (): Promise<LegalDocument> => {
  return apiGet<LegalDocument>(API_ENDPOINTS.LEGAL.COOKIE_POLICY);
};

export const fetchConsentStatus = async (): Promise<ConsentStatus> => {
  return apiGet<ConsentStatus>(API_ENDPOINTS.LEGAL.CONSENT_STATUS);
};

export const acceptPolicies = async (
  types: ('privacy' | 'cookie')[],
  version: string,
): Promise<ConsentStatus> => {
  const body: AcceptConsentDto = { types, version };
  return apiPost<ConsentStatus>(API_ENDPOINTS.LEGAL.ACCEPT, { body });
};
