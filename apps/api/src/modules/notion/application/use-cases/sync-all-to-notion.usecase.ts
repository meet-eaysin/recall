import { Injectable, BadRequestException } from '@nestjs/common';
import { NotionConfigModel, DocumentModel } from '@repo/db';
import type { NotionSyncResult } from '@repo/types';
import { NotionClient } from '../../infrastructure/notion-client';
import { decrypt } from '@repo/crypto';
import { env } from '../../../../shared/utils/env';

@Injectable()
export class SyncAllToNotionUseCase {
  constructor(private readonly notionClient: NotionClient) {}

  async execute(userId: string): Promise<NotionSyncResult> {
    const config = await NotionConfigModel.findOne({
      userId,
      syncEnabled: true,
    }).lean();
    if (!config || !config.accessToken) {
      throw new BadRequestException('Notion sync not configured or enabled');
    }

    const accessToken = config.accessToken;
    if (typeof accessToken !== 'string') {
      throw new BadRequestException('Invalid Notion access token');
    }

    const token = decrypt(accessToken, env.ENCRYPTION_KEY);
    if (typeof token !== 'string') {
      throw new BadRequestException('Invalid Notion token');
    }
    const documents = await DocumentModel.find({ userId });

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    // Batch process in groups of 5
    const batchSize = 5;
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (doc) => {
          try {
            const pageId = doc.notionPageId;
            const targetDatabaseId = config.targetDatabaseId;
            const title = doc.title;

            if (typeof title !== 'string') return;

            if (typeof pageId === 'string') {
              await this.notionClient.updatePage(token, pageId, {
                title,
                content: doc.summary || doc.content || undefined,
                url: doc.sourceUrl || undefined,
              });
            } else if (typeof targetDatabaseId === 'string') {
              const newPageId = await this.notionClient.createPage(
                token,
                targetDatabaseId,
                {
                  title,
                  content: doc.summary || doc.content || undefined,
                  url: doc.sourceUrl || undefined,
                },
              );
              doc.notionPageId = newPageId;
              await doc.save();
            }
            synced++;
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            failed++;
            errors.push(`Failed to sync doc ${doc._id}: ${message}`);
          }
        }),
      );
      // Wait to respect rate limits if more items remain
      if (i + batchSize < documents.length) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    }

    config.lastSyncedAt = new Date();
    await config.save();

    return { synced, failed, errors };
  }
}
