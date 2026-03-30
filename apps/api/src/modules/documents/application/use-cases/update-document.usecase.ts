import { Injectable } from '@nestjs/common';
import { IDocumentRepository } from '../../domain/repositories/document.repository';
import { DocumentPublicView } from '../../domain/entities/document.entity';
import { NotFoundDomainException } from '../../../../shared/errors/not-found.exception';
import { DocumentStatus } from '../../domain/value-objects/document-status.vo';
import { UpdateDocumentCommand } from '../command/update-document';

@Injectable()
export class UpdateDocumentUseCase {
  constructor(private readonly documentRepository: IDocumentRepository) {}

  async execute(command: UpdateDocumentCommand): Promise<DocumentPublicView> {
    if (command.data.status) {
      DocumentStatus.validate(command.data.status);
    }

    const updateData: Record<string, unknown> = {};
    if (command.data.status !== undefined)
      updateData.status = command.data.status;
    if (command.data.title !== undefined) updateData.title = command.data.title;
    if (command.data.folderId !== undefined)
      updateData.folderId = command.data.folderId;
    if (command.data.tagIds !== undefined)
      updateData.tags = command.data.tagIds;
    if (command.data.metadata !== undefined)
      updateData.metadata = command.data.metadata;

    const doc = await this.documentRepository.update(
      command.id,
      command.userId,
      updateData,
    );

    if (!doc) {
      throw new NotFoundDomainException('Document not found');
    }

    return doc.toPublicView();
  }
}
