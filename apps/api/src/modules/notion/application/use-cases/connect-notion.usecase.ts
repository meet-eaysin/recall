import { Injectable } from '@nestjs/common';
import { NotionConfigPublicView, NotionSyncDirectionType } from '@repo/types';
import { NotionConfigEntity } from '../../domain/entities/notion-config.entity';
import { INotionConfigRepository } from '../../domain/repositories/notion-config.repository';
import { NotionClient } from '../../infrastructure/notion-client';
import { encrypt } from '@repo/crypto';
import { env } from '../../../../shared/utils/env';
import { InvalidOperationDomainException } from '../../../../shared/errors/invalid-operation.exception';

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
    try {
      await this.notionClient.listDatabases(accessToken);
    } catch {
      throw new InvalidOperationDomainException('Invalid Notion access token');
    }

    const encryptedToken = encrypt(accessToken, env.ENCRYPTION_KEY);

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

    await this.notionConfigRepository.save(entity);

    return entity.toPublicView();
  }
}
