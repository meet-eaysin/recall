import { NotionSyncDirectionType } from '@repo/types';
import { Document, Types } from 'mongoose';

export interface INotionConfig {
  userId: Types.ObjectId;
  accessToken: string;
  workspaceId: string;
  workspaceName?: string;
  targetDatabaseId?: string;
  syncEnabled: boolean;
  syncDirection: NotionSyncDirectionType;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type INotionConfigDocument = INotionConfig & Document;
