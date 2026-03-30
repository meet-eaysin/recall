import {
  DocumentStatus as RepoDocumentStatus,
  DocumentType as RepoDocumentType,
} from '@repo/types';
import { InvalidOperationDomainException } from '../../../../shared/errors/invalid-operation.exception';

export {
  RepoDocumentStatus as DocumentStatusString,
  RepoDocumentType as DocumentTypeString,
};

export class DocumentType {
  private constructor(private readonly value: RepoDocumentType) {}

  static validate(value: string): DocumentType {
    const enumValue = Object.values(RepoDocumentType).find(
      (candidate) => candidate === value,
    );

    if (!enumValue) {
      throw new InvalidOperationDomainException(
        `Invalid document type: ${value}`,
      );
    }

    return new DocumentType(enumValue);
  }

  static defaultStatus(type: DocumentType): RepoDocumentStatus {
    if (type.getValue() === RepoDocumentType.YOUTUBE) {
      return RepoDocumentStatus.TO_WATCH;
    }

    return RepoDocumentStatus.TO_READ;
  }

  getValue(): RepoDocumentType {
    return this.value;
  }

  toString(): string {
    return this.value;
  }
}
