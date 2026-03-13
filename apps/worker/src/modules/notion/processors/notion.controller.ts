import { Logger, Controller, Post, UseGuards, Body, Headers } from '@nestjs/common';
import { QStashGuard } from '../../../shared/guards/qstash.guard';
import {
  NotionSyncJobData,
  QUEUE_NOTION_SYNC,
  NotionAction,
} from '@repo/types';
import { DocumentModel, NotionConfigModel } from '@repo/db';
import { NotionClient } from '../notion-client';
import { decrypt } from '@repo/crypto';
import { env } from '../../../shared/utils/env';

@Controller('api/webhooks')
export class NotionController {
  private readonly logger = new Logger(NotionController.name);

  constructor(private readonly notionClient: NotionClient) {}

  @Post(QUEUE_NOTION_SYNC)
  @UseGuards(QStashGuard)
  async process(
    @Body() data: NotionSyncJobData,
    @Headers('Upstash-Message-Id') messageId: string,
  ): Promise<void> {
    try {
      await this.processJob(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `[NotionController] Job ${messageId} failed: ${errorMessage}`,
      );
      throw err;
    }
  }

  private async processJob(data: NotionSyncJobData): Promise<void> {
    const { documentId, userId, action } = data;

    const config = await NotionConfigModel.findOne({ userId });
    if (
      !config ||
      !config.accessToken ||
      !config.syncEnabled ||
      !config.targetDatabaseId
    ) {
      return;
    }

    const doc = await DocumentModel.findById(documentId);
    if (!doc && action !== NotionAction.DELETE) {
      return;
    }

    const accessToken = config.accessToken;
    if (typeof accessToken !== 'string') {
      this.logger.error(`Invalid access token for user ${userId}`);
      return;
    }

    const token = decrypt(accessToken, env.ENCRYPTION_KEY);
    if (typeof token !== 'string') {
      this.logger.error(`Decryption failed for user ${userId}`);
      return;
    }

    try {
      const targetDatabaseId = config.targetDatabaseId;
      if (typeof targetDatabaseId !== 'string') {
        this.logger.error(`Database not configured for user ${userId}`);
        return;
      }

      if (action === NotionAction.CREATE) {
        if (!doc) return;

        const title = doc.title;
        if (typeof title !== 'string') return;

        const pageId = await this.notionClient.createPage(
          token,
          targetDatabaseId,
          {
            title,
            content: doc.summary || doc.content || undefined,
            url: doc.sourceUrl || undefined,
          },
        );
        doc.notionPageId = pageId;
        await doc.save();
      } else if (action === NotionAction.UPDATE) {
        const pageId = doc?.notionPageId;
        if (!doc || typeof pageId !== 'string') return;

        const title = doc.title;
        if (typeof title !== 'string') return;

        await this.notionClient.updatePage(token, pageId, {
          title,
          content: doc.summary || doc.content || undefined,
          url: doc.sourceUrl || undefined,
        });
      } else if (action === NotionAction.DELETE) {
        const pageId = doc?.notionPageId;
        if (doc && typeof pageId === 'string') {
          try {
            await this.notionClient.deletePage(token, pageId);
          } catch (error: unknown) {
            const message =
              error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to delete Notion page: ${message}`);
          }
          doc.notionPageId = undefined;
          await doc.save();
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Sync failed for doc ${documentId}: ${message}`);
      throw error; // Let QStash handle retries
    }
  }
}
