import type { Model } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import { IngestionStatus } from '@repo/types';
import type { IIngestionJobDocument } from '../types/ingestion-job.type';

const ingestionJobSchema = new Schema<IIngestionJobDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(IngestionStatus),
      default: IngestionStatus.PENDING,
      index: true,
    },
    error: { type: String },
    progress: { type: Number, default: 0 },
    stages: {
      type: Map,
      of: {
        status: { type: String, enum: Object.values(IngestionStatus) },
        updatedAt: { type: Date, default: Date.now },
      },
      default: {},
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

ingestionJobSchema.index({ documentId: 1 }, { unique: true });

const ModelInstance = (mongoose.models['IngestionJob'] ||
  mongoose.model<IIngestionJobDocument>(
    'IngestionJob',
    ingestionJobSchema,
  )) as Model<IIngestionJobDocument>;

export { ModelInstance as IngestionJobModel };
