import { Injectable } from '@nestjs/common';
import { NotionConfigModel } from '@repo/db';
import { NotionConfigEntity } from '../../domain/entities/notion-config.entity';
import { INotionConfigRepository } from '../../domain/repositories/notion-config.repository';
import { Types } from 'mongoose';

@Injectable()
export class MongooseNotionConfigRepository extends INotionConfigRepository {
  async findByUserId(userId: string): Promise<NotionConfigEntity | null> {
    const config = await NotionConfigModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!config) return null;

    return new NotionConfigEntity({
      id: config._id.toString(),
      userId: config.userId.toString(),
      accessToken: config.accessToken,
      workspaceId: config.workspaceId,
      workspaceName: config.workspaceName,
      targetDatabaseId: config.targetDatabaseId,
      syncEnabled: config.syncEnabled,
      syncDirection: config.syncDirection,
      lastSyncedAt: config.lastSyncedAt,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    });
  }

  async save(entity: NotionConfigEntity): Promise<void> {
    await NotionConfigModel.findOneAndUpdate(
      { userId: new Types.ObjectId(entity.userId) },
      {
        accessToken: entity.accessToken,
        workspaceId: entity.props.workspaceId,
        workspaceName: entity.props.workspaceName,
        targetDatabaseId: entity.props.targetDatabaseId,
        syncEnabled: entity.props.syncEnabled,
        syncDirection: entity.props.syncDirection,
        lastSyncedAt: entity.props.lastSyncedAt,
      },
      { upsert: true, new: true },
    );
  }

  async deleteByUserId(userId: string): Promise<void> {
    await NotionConfigModel.deleteOne({ userId: new Types.ObjectId(userId) });
  }
}
