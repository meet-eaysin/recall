import type { Model } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import type { IDocumentDocument } from '../types/document.type';
import {
  DocumentType,
  DocumentStatus,
  SourceType,
  IngestionStatus,
} from '../types/document.type';

const documentSchema = new Schema<IDocumentDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    folderId: { type: Schema.Types.ObjectId, ref: 'Folder', index: true },
    title: { type: String, required: true, index: true },
    content: { type: String },
    type: {
      type: String,
      enum: Object.values(DocumentType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(DocumentStatus),
      required: true,
    },
    sourceType: {
      type: String,
      enum: Object.values(SourceType),
      required: true,
    },
    sourceUrl: { type: String },
    mimeType: { type: String },
    tags: [{ type: String, index: true }],
    summary: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },

    // Ingestion tracking
    ingestionStatus: {
      type: String,
      enum: Object.values(IngestionStatus),
      default: IngestionStatus.PENDING,
    },
    currentStage: { type: String },
    embeddingsReady: { type: Boolean, default: false },
    ocrConfidence: { type: Number },
    chunkCount: { type: Number },
    ingestionError: { type: String },

    notionPageId: { type: String, index: true },

    lastOpenedAt: { type: Date },
  },
  { timestamps: true },
);

documentSchema.index({ userId: 1, sourceUrl: 1 }, { unique: true });
documentSchema.index({ title: 'text', content: 'text' });

export const DocumentModel: Model<IDocumentDocument> =
  mongoose.models['Document'] ||
  mongoose.model<IDocumentDocument>('Document', documentSchema);
