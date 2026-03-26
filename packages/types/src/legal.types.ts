export type LegalDocumentType = 'privacy' | 'cookie' | 'terms';

export type CookieCategory = 'necessary' | 'analytics' | 'marketing';

export interface LegalDocument {
  id: string;
  type: LegalDocumentType;
  version: string;
  title: string;
  content: string; // Markdown
  effectiveDate: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsentRecord {
  id: string;
  userId?: string;
  anonymousId?: string;
  policyVersions: Record<LegalDocumentType, string>;
  categories: CookieCategory[];
  ip: string;
  userAgent: string;
  timestamp: Date;
}

export interface AcceptConsentDto {
  policyVersions: Record<LegalDocumentType, string>;
  categories: CookieCategory[];
}

export interface ConsentStatus {
  privacyAccepted: boolean;
  cookieAccepted: boolean;
  termsAccepted: boolean;
  acceptedCategories: CookieCategory[];
  requiredVersions: Record<LegalDocumentType, string>;
}
