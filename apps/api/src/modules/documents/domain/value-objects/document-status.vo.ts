import { BadRequestException } from '@nestjs/common';
import { DocumentStatus as RepoDocumentStatus } from '@repo/types';

export class DocumentStatus {
  private constructor(private readonly value: RepoDocumentStatus) {}

  static validate(v: string): DocumentStatus {
    const enumValue = Object.values(RepoDocumentStatus).find(
      (val) => val === v,
    );
    if (!enumValue) {
      throw new BadRequestException(`Invalid document status: ${v}`);
    }
    return new DocumentStatus(enumValue);
  }

  getValue(): RepoDocumentStatus {
    return this.value;
  }

  toString(): string {
    return this.value;
  }
}
