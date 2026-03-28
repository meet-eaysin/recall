import { Injectable, Logger } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository';
import { IDocumentRepository } from '../../../documents/domain/repositories/document.repository';
import { INoteRepository } from '../../../knowledge/domain/repositories/note.repository';
import { IFolderRepository } from '../../../knowledge/domain/repositories/folder.repository';
import { ITagRepository } from '../../../knowledge/domain/repositories/tag.repository';
import { IGraphRepository } from '../../../graph/domain/repositories/graph.repository';
import { INotionConfigRepository } from '../../../notion/domain/repositories/notion-config.repository';
import { IRefreshSessionRepository } from '../../../auth/domain/repositories/refresh-session.repository';

@Injectable()
export class DeleteAccountUseCase {
  private readonly logger = new Logger(DeleteAccountUseCase.name);

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly documentRepository: IDocumentRepository,
    private readonly noteRepository: INoteRepository,
    private readonly folderRepository: IFolderRepository,
    private readonly tagRepository: ITagRepository,
    private readonly graphRepository: IGraphRepository,
    private readonly notionConfigRepository: INotionConfigRepository,
    private readonly refreshSessionRepository: IRefreshSessionRepository,
  ) {}

  async execute(userId: string): Promise<void> {
    this.logger.log(`Starting account deletion for user: ${userId}`);

    try {
      // 1. Delete Documents
      await this.documentRepository.deleteAllByUserId(userId);

      // 2. Delete Knowledge Base (Notes, Folders, Tags)
      await Promise.all([
        this.noteRepository.deleteAllByUserId(userId),
        this.folderRepository.deleteAllByUserId(userId),
        this.tagRepository.deleteAllByUserId(userId),
      ]);

      // 3. Delete Graph Data
      await this.graphRepository.deleteAllByUserId(userId);

      // 4. Delete Notion Configuration
      await this.notionConfigRepository.deleteByUserId(userId);

      // 5. Revoke all sessions
      await this.refreshSessionRepository.revokeAllForUser(userId);

      // 6. Finally, delete the User record
      // Note: LLM settings are stored on the User document, so they are deleted here.
      await this.userRepository.delete(userId);
      this.logger.log(`Successfully deleted account for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete account for user: ${userId}`, error);
      throw error;
    }
  }
}
