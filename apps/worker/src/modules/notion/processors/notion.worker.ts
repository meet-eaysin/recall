import { Processor, WorkerHost, OnWorkerEvent, Job } from '@repo/queue';
import { Injectable, Logger } from '@nestjs/common';
import {
  NotionSyncJobData,
  QUEUE_NOTION_SYNC,
  NotionAction,
} from '@repo/types';
import { DocumentModel, NotionConfigModel } from '@repo/db';
import { NotionClient } from '../notion-client';
import { decrypt } from '@repo/crypto';
import { env } from '../../../shared/utils/env';

@Processor(QUEUE_NOTION_SYNC)
@Injectable()
export class NotionWorker extends WorkerHost {
  private readonly logger = new Logger(NotionWorker.name);

  constructor(private readonly notionClient: NotionClient) {
    super();
  }

  async process(job: Job<NotionSyncJobData>): Promise<void> {
    await this.processJob(job);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<NotionSyncJobData> | undefined, err: Error) {
    const jobId = job?.id ?? 'unknown';
    this.logger.error(`[NotionWorker] Job ${jobId} failed: ${err.message}`);
  }

  private async processJob(job: Job<NotionSyncJobData>): Promise<void> {
    const { documentId, userId, action } = job.data;

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
      throw error; // Let BullMQ handle retries
    }
  }
}
