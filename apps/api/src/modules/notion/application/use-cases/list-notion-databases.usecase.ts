import { Injectable, Logger, Inject } from '@nestjs/common';
import type { NotionDatabase } from '@repo/types';
import { NotionClient } from '../../infrastructure/notion-client';
import { decrypt } from '@repo/crypto';
import { env } from '../../../../shared/utils/env';
import { INotionConfigRepository } from '../../domain/repositories/notion-config.repository';
import { NotFoundDomainException } from '../../../../shared/errors/not-found.exception';
import { InvalidOperationDomainException } from '../../../../shared/errors/invalid-operation.exception';

@Injectable()
export class ListNotionDatabasesUseCase {
  private readonly logger = new Logger(ListNotionDatabasesUseCase.name);

  constructor(
    private readonly notionClient: NotionClient,
    @Inject(INotionConfigRepository)
    private readonly notionConfigRepository: INotionConfigRepository,
  ) {}

  async execute(userId: string): Promise<NotionDatabase[]> {
    const config = await this.notionConfigRepository.findByUserId(userId);
    if (!config || !config.accessToken) {
      throw new NotFoundDomainException('Notion not connected');
    }

    const accessToken = config.accessToken;
    if (typeof accessToken !== 'string') {
      throw new InvalidOperationDomainException('Invalid Notion configuration');
    }

    try {
      const token = decrypt(accessToken, env.ENCRYPTION_KEY);
      if (typeof token !== 'string') {
        throw new InvalidOperationDomainException('Invalid decrypted token');
      }
      return await this.notionClient.listDatabases(token);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to list Notion databases: ${message}`);
      throw new InvalidOperationDomainException(
        'Failed to fetch databases from Notion',
        'NOTION_REQUEST_FAILED',
      );
    }
  }
}
