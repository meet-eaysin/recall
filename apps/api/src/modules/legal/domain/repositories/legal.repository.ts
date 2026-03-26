import type { LegalDocumentType } from '@repo/types';
import type { ILegalDocumentDocument } from '@repo/db';

export abstract class ILegalRepository {
  abstract findActivePolicy(
    type: LegalDocumentType,
  ): Promise<ILegalDocumentDocument | null>;
  abstract findByVersion(
    type: LegalDocumentType,
    version: string,
  ): Promise<ILegalDocumentDocument | null>;
  abstract create(
    data: Partial<ILegalDocumentDocument>,
  ): Promise<ILegalDocumentDocument>;
}
