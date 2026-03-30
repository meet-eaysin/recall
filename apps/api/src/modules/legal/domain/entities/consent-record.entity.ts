import type { CookieCategory, LegalDocumentType } from '@repo/types';

export interface ConsentRecordEntityProps {
  id: string;
  userId?: string;
  anonymousId?: string;
  policyVersions: Partial<Record<LegalDocumentType, string>>;
  categories: CookieCategory[];
  ip: string;
  userAgent: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class ConsentRecordEntity {
  constructor(public readonly props: ConsentRecordEntityProps) {}

  get policyVersions(): Partial<Record<LegalDocumentType, string>> {
    return this.props.policyVersions;
  }
}
