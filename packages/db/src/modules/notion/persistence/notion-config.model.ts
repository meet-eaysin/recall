import type { Model } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import type { INotionConfigDocument } from '../types/notion-config.type';
import { NotionSyncDirectionType } from '@repo/types';

const notionConfigSchema = new Schema<INotionConfigDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    accessToken: { type: String, required: true },
    workspaceId: { type: String, required: true },
    workspaceName: { type: String },
    targetDatabaseId: { type: String },
    syncEnabled: { type: Boolean, default: false },
    syncDirection: {
      type: String,
      enum: NotionSyncDirectionType,
      default: NotionSyncDirectionType.TO_NOTION,
    },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true },
);

export const NotionConfigModel: Model<INotionConfigDocument> =
  (mongoose.models['NotionConfig'] as Model<INotionConfigDocument>) ||
  mongoose.model<INotionConfigDocument>('NotionConfig', notionConfigSchema);
