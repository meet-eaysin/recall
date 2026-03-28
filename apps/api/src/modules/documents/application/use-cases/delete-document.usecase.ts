import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IDocumentRepository } from '../../domain/repositories/document.repository';
import { IStorageProvider } from '@repo/storage';

@Injectable()
export class DeleteDocumentUseCase {
  private readonly logger = new Logger(DeleteDocumentUseCase.name);

  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly storageProvider: IStorageProvider,
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const doc = await this.documentRepository.findById(id, userId);

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    const isUploadBackedFile =
      doc.toPublicView().sourceType === 'file' &&
      (doc.props.type === 'pdf' || doc.props.type === 'image');

    if (isUploadBackedFile && doc.sourceUrl) {
      try {
        await this.storageProvider.delete(doc.sourceUrl);
      } catch (err) {
        this.logger.error(`Failed to delete file: ${doc.sourceUrl}`, err);
      }
    }

    await this.documentRepository.delete(id, userId);
  }
}
