import { Injectable, Logger } from '@nestjs/common';
import { QueueService } from '@repo/queue';
import { IDocumentRepository } from '../../domain/repositories/document.repository';
import { ConflictDomainException } from '../../../../shared/errors/conflict.exception';
import { InvalidOperationDomainException } from '../../../../shared/errors/invalid-operation.exception';
import {
  DocumentEntity,
  DocumentPublicView,
} from '../../domain/entities/document.entity';
import { DocumentType as DomainDocumentType } from '../../domain/value-objects/document-type.vo';
import {
  DocumentType,
  SourceType,
  IngestionStatus,
  TranscriptStatus,
  QUEUE_INGESTION,
} from '@repo/types';
import { IStorageProvider } from '@repo/storage';
import { validateFileType } from '../../../../shared/infrastructure/file-validation';
import { SmartAddDocumentCommand } from '../command/smart-add-document';

@Injectable()
export class SmartAddDocumentUseCase {
  private readonly logger = new Logger(SmartAddDocumentUseCase.name);

  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly queueService: QueueService,
    private readonly storageProvider: IStorageProvider,
  ) {}

  async execute(command: SmartAddDocumentCommand): Promise<DocumentPublicView> {
    let finalSourceUrl = '';
    let finalSourceType = SourceType.URL;
    let finalDocumentType = DocumentType.URL;
    let initialTitle = command.title;

    if ((command.buffer || command.stream) && command.originalName) {
      if (command.buffer) {
        const fileType = validateFileType(
          command.buffer,
          command.mimeType || '',
        );
        if (fileType === 'pdf') {
          finalDocumentType = DocumentType.PDF;
        } else if (fileType === 'image') {
          finalDocumentType = DocumentType.IMAGE;
        } else if (fileType === 'docx') {
          finalDocumentType = DocumentType.DOCX;
        } else {
          finalDocumentType = DocumentType.TEXT;
        }
      } else {
        // Fallback to mimeType for streams if we can't easily peek
        const isPdf = command.mimeType?.includes('pdf');
        const isImage = command.mimeType?.includes('image');
        const isDocx = command.mimeType?.includes(
          'officedocument.wordprocessingml',
        );

        if (isPdf) {
          finalDocumentType = DocumentType.PDF;
        } else if (isImage) {
          finalDocumentType = DocumentType.IMAGE;
        } else if (isDocx) {
          finalDocumentType = DocumentType.DOCX;
        } else {
          finalDocumentType = DocumentType.TEXT;
        }
      }

      finalSourceType = SourceType.FILE;
      const fileName = `${Date.now()}-${command.originalName}`;
      const filePath = `${command.userId}/${fileName}`;

      const uploadSource = command.buffer || command.stream;
      if (!uploadSource) {
        throw new InvalidOperationDomainException(
          'File buffer or stream is missing',
        );
      }

      finalSourceUrl = await this.storageProvider.upload(
        uploadSource,
        filePath,
        {
          contentType: command.mimeType || undefined,
        },
      );
      if (!initialTitle) {
        initialTitle = command.originalName;
      }
    } else if (command.source) {
      finalSourceUrl = command.source;
      finalSourceType = SourceType.URL;

      if (
        finalSourceUrl.includes('youtube.com') ||
        finalSourceUrl.includes('youtu.be')
      ) {
        finalDocumentType = DocumentType.YOUTUBE;
      } else if (
        finalSourceUrl.includes('twitter.com') ||
        finalSourceUrl.includes('x.com')
      ) {
        finalDocumentType = DocumentType.URL;
      } else if (finalSourceUrl.toLowerCase().endsWith('.pdf')) {
        finalDocumentType = DocumentType.PDF;
      } else {
        finalDocumentType = DocumentType.URL;
      }

      if (!initialTitle) initialTitle = finalSourceUrl;

      const existingDocId = await this.documentRepository.existsBySource(
        command.userId,
        finalSourceUrl,
      );
      if (existingDocId) {
        throw new ConflictDomainException(
          'A document with this URL already exists in your library',
        );
      }
    } else {
      throw new InvalidOperationDomainException(
        'Must provide either a file or a source URL',
      );
    }

    const docType = DomainDocumentType.validate(finalDocumentType);

    if (!initialTitle || initialTitle.trim() === '') {
      initialTitle = 'Untitled Document';
    }

    const metadata: Record<string, unknown> = {};
    if (command.notes) {
      metadata.userNotes = command.notes;
    }
    if (command.description) {
      metadata.description = command.description;
    }

    const requiresTitle = !command.title || command.title.trim() === '';
    const requiresDescription =
      !command.description || command.description.trim() === '';

    metadata.requiresEnrichment = requiresTitle || requiresDescription;
    metadata.requiresEnrichmentTitle = requiresTitle;
    metadata.requiresEnrichmentDescription = requiresDescription;

    const doc = DocumentEntity.create({
      id: '',
      userId: command.userId,
      title: initialTitle,
      content: undefined,
      type: docType.getValue(),
      status: DomainDocumentType.defaultStatus(docType),
      sourceType: finalSourceType,
      sourceUrl: finalSourceUrl,
      tags: command.tagIds ?? [],
      folderId: command.folderIds?.[0] ?? undefined,
      metadata,
      embeddingsReady: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ingestionStatus: IngestionStatus.PENDING,
      transcriptStatus: TranscriptStatus.IDLE,
    });

    const savedDoc = await this.documentRepository.create(doc);

    this.logger.log(
      `Smart Document added: ${savedDoc.title} (ID: ${savedDoc.id}) by User: ${command.userId}`,
    );

    this.queueService
      .publishMessage(QUEUE_INGESTION, {
        documentId: savedDoc.id,
        userId: command.userId,
        type: docType.getValue(),
        source: finalSourceUrl,
      })
      .catch((err: Error) => {
        this.logger.error(
          `Failed to push job for doc ${savedDoc.id}: ${err.message}`,
        );
      });

    const view = savedDoc.toPublicView();

    // If it's a file, provide a signed URL for immediate viewing
    if (view.sourceType === SourceType.FILE && view.sourceUrl) {
      try {
        view.sourceUrl = await this.storageProvider.getSignedUrl(
          view.sourceUrl,
        );
      } catch (err) {
        this.logger.warn(
          `Failed to sign URL for new doc ${savedDoc.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return view;
  }
}
