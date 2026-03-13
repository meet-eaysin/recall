import { Document, Types } from 'mongoose';
import { IngestionStatus, IngestionStage } from '@repo/types';

export interface IIngestionJob {
  userId: Types.ObjectId;
  documentId: Types.ObjectId;
  status: IngestionStatus;
  error?: string;
  progress: number;
  stages: Record<IngestionStage, { status: IngestionStatus; updatedAt: Date }>;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type IIngestionJobDocument = IIngestionJob & Document;
