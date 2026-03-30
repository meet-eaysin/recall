import type { LegalDocumentType } from '@repo/types';
import type {
  LegalDocumentEntity,
  LegalDocumentEntityProps,
} from '../entities/legal-document.entity';

export abstract class ILegalRepository {
  abstract findActivePolicy(
    type: LegalDocumentType,
  ): Promise<LegalDocumentEntity | null>;
  abstract findByVersion(
    type: LegalDocumentType,
    version: string,
  ): Promise<LegalDocumentEntity | null>;
  abstract create(
    data: Omit<LegalDocumentEntityProps, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<LegalDocumentEntity>;
}
