import {
  Injectable,
  NotFoundException,
  BadGatewayException,
  Logger,
} from '@nestjs/common';
import { NotionConfigModel } from '@repo/db';
import type { NotionDatabase } from '@repo/types';
import { NotionClient } from '../../infrastructure/notion-client';
import { decrypt } from '@repo/crypto';
import { env } from '../../../../shared/utils/env';

@Injectable()
export class ListNotionDatabasesUseCase {
  private readonly logger = new Logger(ListNotionDatabasesUseCase.name);

  constructor(private readonly notionClient: NotionClient) {}

  async execute(userId: string): Promise<NotionDatabase[]> {
    const config = await NotionConfigModel.findOne({ userId }).lean();
    if (!config || !config.accessToken) {
      throw new NotFoundException('Notion not connected');
    }

    const accessToken = config.accessToken;
    if (typeof accessToken !== 'string') {
      throw new BadGatewayException('Invalid Notion configuration');
    }

    try {
      const token = decrypt(accessToken, env.ENCRYPTION_KEY);
      if (typeof token !== 'string') {
        throw new BadGatewayException('Invalid decrypted token');
      }
      return await this.notionClient.listDatabases(token);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to list Notion databases: ${message}`);
      throw new BadGatewayException('Failed to fetch databases from Notion');
    }
  }
}
