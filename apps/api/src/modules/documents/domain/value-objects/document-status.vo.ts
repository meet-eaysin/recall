import { DocumentStatus as RepoDocumentStatus } from '@repo/types';
import { InvalidOperationDomainException } from '../../../../shared/errors/invalid-operation.exception';

export class DocumentStatus {
  private constructor(private readonly value: RepoDocumentStatus) {}

  static validate(v: string): DocumentStatus {
    const enumValue = Object.values(RepoDocumentStatus).find(
      (val) => val === v,
    );
    if (!enumValue) {
      throw new InvalidOperationDomainException(
        `Invalid document status: ${v}`,
      );
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
