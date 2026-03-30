import type { CookieCategory, LegalDocumentType } from '@repo/types';
import type { ConsentRecordEntity } from '../entities/consent-record.entity';

export interface CreateConsentRecordData {
  userId?: string;
  anonymousId?: string;
  policyVersions: Partial<Record<LegalDocumentType, string>>;
  categories: CookieCategory[];
  ip: string;
  userAgent: string;
  timestamp: Date;
}

export abstract class IConsentRepository {
  abstract create(data: CreateConsentRecordData): Promise<ConsentRecordEntity>;
  abstract findLatestByUserId(
    userId: string,
  ): Promise<ConsentRecordEntity | null>;
  abstract findLatestByAnonymousId(
    anonymousId: string,
  ): Promise<ConsentRecordEntity | null>;
}
