import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { QStashService } from '@repo/queue';
import { IDocumentRepository } from '../../domain/repositories/document.repository';
import {
  DocumentEntity,
  DocumentPublicView,
} from '../../domain/entities/document.entity';
import { DocumentType as DomainDocumentType } from '../../domain/value-objects/document-type.vo';
import {
  DocumentType,
  SourceType,
  IngestionStatus,
  QUEUE_INGESTION,
} from '@repo/types';
import { CreateDocumentCommand } from '../command/create-document';

@Injectable()
export class CreateDocumentUseCase {
  private readonly logger = new Logger(CreateDocumentUseCase.name);

  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly qstashService: QStashService,
  ) {}

  async execute(command: CreateDocumentCommand): Promise<DocumentPublicView> {
    const docType = DomainDocumentType.validate(command.type);

    const existingId = await this.documentRepository.existsBySource(
      command.userId,
      command.source,
    );

    if (existingId) throw new ConflictException('Document already exists');

    const defaultStatus = DomainDocumentType.defaultStatus(docType);

    const doc = DocumentEntity.create({
      id: '',
      userId: command.userId,
      title: command.title ?? command.source,
      content: undefined,
      type: docType.getValue(),
      status: defaultStatus,
      sourceType:
        docType.getValue() === DocumentType.URL ||
        docType.getValue() === DocumentType.YOUTUBE
          ? SourceType.URL
          : SourceType.FILE,
      sourceUrl: command.source,
      tags: command.tagIds ?? [],
      folderId: command.folderIds?.[0] ?? undefined,
      metadata: command.metadata ?? {},
      embeddingsReady: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ingestionStatus: IngestionStatus.PENDING,
    });

    const savedDoc = await this.documentRepository.create(doc);

    // Log user activity
    this.logger.log(
      `Document added: ${savedDoc.title} (ID: ${savedDoc.id}) by User: ${command.userId}`,
    );

    // Push to ingestion webhook - do NOT await
    this.qstashService
      .publishMessage(QUEUE_INGESTION, {
        documentId: savedDoc.id,
        userId: command.userId,
        type: docType.getValue(), // Use actual doc type
        source: command.source,
      })
      .catch((err: Error) => {
        this.logger.error(
          `Failed to push job for doc ${savedDoc.id}: ${err.message}`,
        );
      });

    return savedDoc.toPublicView();
  }
}
