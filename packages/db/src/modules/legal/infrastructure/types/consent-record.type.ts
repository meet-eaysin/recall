import { Document } from 'mongoose';
import { LegalDocumentType, CookieCategory } from '@repo/types';

export interface IConsentRecord {
  userId?: string;
  anonymousId?: string;
  policyVersions: Record<LegalDocumentType, string>;
  categories: CookieCategory[];
  ip: string;
  userAgent: string;
  timestamp: Date;
}

export type IConsentRecordDocument = IConsentRecord & Document;
