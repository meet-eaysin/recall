import { Injectable, UnauthorizedException } from '@nestjs/common';
import { NotionConfigPublicView, NotionSyncDirectionType } from '@repo/types';
import { NotionConfigEntity } from '../../domain/entities/notion-config.entity';
import { INotionConfigRepository } from '../../domain/repositories/notion-config.repository';
import { NotionClient } from '../../infrastructure/notion-client';
import { encrypt } from '@repo/crypto';
import { env } from '../../../../shared/utils/env';

@Injectable()
export class ConnectNotionUseCase {
  constructor(
    private readonly notionClient: NotionClient,
    private readonly notionConfigRepository: INotionConfigRepository,
  ) {}

  async execute(
    userId: string,
    accessToken: string,
  ): Promise<NotionConfigPublicView> {
    // 1. Validate token
    try {
      await this.notionClient.listDatabases(accessToken);
    } catch {
      throw new UnauthorizedException('Invalid Notion access token');
    }

    // 2. Encrypt token
    const encryptedToken = encrypt(accessToken, env.ENCRYPTION_KEY);

    // 3. Create Entity (with dummy workspace info as we don't have OAuth response here)
    const entity = new NotionConfigEntity({
      userId,
      accessToken: encryptedToken,
      workspaceId: 'manual_connection',
      workspaceName: 'Notion Workspace',
      syncEnabled: true,
      syncDirection: NotionSyncDirectionType.TO_NOTION,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 4. Save via repository
    await this.notionConfigRepository.save(entity);

    return entity.toPublicView();
  }
}
