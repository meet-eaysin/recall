import type { IConsentRecordDocument } from '@repo/db';

export abstract class IConsentRepository {
  abstract create(
    data: Partial<IConsentRecordDocument>,
  ): Promise<IConsentRecordDocument>;
  abstract findLatestByUserId(
    userId: string,
  ): Promise<IConsentRecordDocument | null>;
  abstract findLatestByAnonymousId(
    anonymousId: string,
  ): Promise<IConsentRecordDocument | null>;
}
