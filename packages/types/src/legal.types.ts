export type LegalDocumentType = 'privacy' | 'cookie';

export interface LegalDocument {
  id: string;
  type: LegalDocumentType;
  version: string;
  title: string;
  content: string; // Markdown/HTML
  effectiveDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserConsent {
  privacyPolicyAcceptedAt: Date | null;
  cookiePolicyAcceptedAt: Date | null;
  consentVersion: string | null;
  consentIp: string | null;
  consentUserAgent: string | null;
}

export interface AcceptConsentDto {
  types: LegalDocumentType[];
  version: string;
}

export interface ConsentStatus {
  privacyAccepted: boolean;
  cookieAccepted: boolean;
  requiredVersion: string;
}
