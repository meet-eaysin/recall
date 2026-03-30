import { Injectable } from '@nestjs/common';
import {
  IDocumentRepository,
  IngestionStatusView,
} from '../../domain/repositories/document.repository';
import { NotFoundDomainException } from '../../../../shared/errors/not-found.exception';

@Injectable()
export class GetIngestionStatusUseCase {
  constructor(private readonly documentRepository: IDocumentRepository) {}

  async execute(id: string, userId: string): Promise<IngestionStatusView> {
    const status = await this.documentRepository.getIngestionStatus(id, userId);

    if (!status) {
      throw new NotFoundDomainException(
        'Document or ingestion status not found',
      );
    }

    return status;
  }
}
