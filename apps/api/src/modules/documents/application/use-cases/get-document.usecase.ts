import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IDocumentRepository } from '../../domain/repositories/document.repository';
import { DocumentDetailView } from '../../domain/entities/document.entity';
import { IStorageProvider } from '@repo/storage';
import { SourceType } from '@repo/types';

@Injectable()
export class GetDocumentUseCase {
  private readonly logger = new Logger(GetDocumentUseCase.name);

  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly storageProvider: IStorageProvider,
  ) {}

  async execute(id: string, userId: string): Promise<DocumentDetailView> {
    const updatedDoc = await this.documentRepository.update(id, userId, {
      lastOpenedAt: new Date(),
    });

    if (!updatedDoc) {
      throw new NotFoundException('Document not found');
    }

    // Log activity
    this.logger.log(`Document opened: ${id} by User: ${userId}`);

    const view = updatedDoc.toDetailView();

    // If it's an internal file, generate a signed URL
    if (view.sourceType === SourceType.FILE && view.sourceUrl) {
      try {
        view.sourceUrl = await this.storageProvider.getSignedUrl(view.sourceUrl);
      } catch (err) {
        this.logger.warn(`Failed to generate signed URL for document ${id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return view;
  }
}
