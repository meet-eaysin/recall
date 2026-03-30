import { Injectable, Inject } from '@nestjs/common';
import type { NotionSyncResult } from '@repo/types';
import { NotionClient } from '../../infrastructure/notion-client';
import { decrypt } from '@repo/crypto';
import { env } from '../../../../shared/utils/env';
import { INotionConfigRepository } from '../../domain/repositories/notion-config.repository';
import { IDocumentRepository } from '../../../documents/domain/repositories/document.repository';
import { NotionConfigEntity } from '../../domain/entities/notion-config.entity';
import { InvalidOperationDomainException } from '../../../../shared/errors/invalid-operation.exception';

@Injectable()
export class SyncAllToNotionUseCase {
  constructor(
    private readonly notionClient: NotionClient,
    @Inject(INotionConfigRepository)
    private readonly notionConfigRepository: INotionConfigRepository,
    @Inject(IDocumentRepository)
    private readonly documentRepository: IDocumentRepository,
  ) {}

  async execute(userId: string): Promise<NotionSyncResult> {
    const config = await this.notionConfigRepository.findByUserId(userId);
    if (!config || !config.props.syncEnabled || !config.accessToken) {
      throw new InvalidOperationDomainException(
        'Notion sync not configured or enabled',
      );
    }

    const accessToken = config.accessToken;
    if (typeof accessToken !== 'string') {
      throw new InvalidOperationDomainException('Invalid Notion access token');
    }

    const token = decrypt(accessToken, env.ENCRYPTION_KEY);
    if (typeof token !== 'string') {
      throw new InvalidOperationDomainException('Invalid Notion token');
    }
    const documents = await this.documentRepository.findAllByUserId(userId);

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
            const pageId = doc.props.metadata?.notionPageId;
            const targetDatabaseId = config.props.targetDatabaseId;
            const title = doc.title;

            if (typeof title !== 'string') return;

            if (typeof pageId === 'string') {
              await this.notionClient.updatePage(token, pageId, {
                title,
                content: doc.props.summary || doc.content || undefined,
                url: doc.sourceUrl || undefined,
              });
            } else if (typeof targetDatabaseId === 'string') {
              const newPageId = await this.notionClient.createPage(
                token,
                targetDatabaseId,
                {
                  title,
                  content: doc.props.summary || doc.content || undefined,
                  url: doc.sourceUrl || undefined,
                },
              );
              await this.documentRepository.update(doc.id, userId, {
                metadata: {
                  ...doc.props.metadata,
                  notionPageId: newPageId,
                },
              });
            }
            synced++;
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            failed++;
            errors.push(`Failed to sync doc ${doc.id}: ${message}`);
          }
        }),
      );
      // Wait to respect rate limits if more items remain
      if (i + batchSize < documents.length) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    }

    await this.notionConfigRepository.save(
      new NotionConfigEntity({
        ...config.props,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    return { synced, failed, errors };
  }
}
