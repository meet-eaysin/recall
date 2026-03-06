import { BadRequestException } from '@nestjs/common';
import {
  DocumentType as RepoDocumentType,
  DocumentStatus as RepoDocumentStatus,
} from '@repo/types';

export {
  RepoDocumentType as DocumentTypeString,
  RepoDocumentStatus as DocumentStatusString,
};

export class DocumentType {
  private constructor(private readonly value: RepoDocumentType) {}

  static validate(v: string): DocumentType {
    const enumValue = Object.values(RepoDocumentType).find((val) => val === v);
    if (!enumValue) {
      throw new BadRequestException(`Invalid document type: ${v}`);
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
