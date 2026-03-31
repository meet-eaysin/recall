import type { Model } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import type { IDocumentChunkDocument } from '../types/document-chunk.type';

const documentChunkSchema = new Schema<IDocumentChunkDocument>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: { type: String, required: true },
    index: { type: Number, required: true },
    tokenCount: { type: Number, required: true },
    embedding: { type: [Number] }, // No hashed index on arrays
    metadata: {
      pageNumber: { type: Number },
      chunkIndex: { type: Number, required: true },
      heading: { type: String },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

documentChunkSchema.index(
  { documentId: 1, 'metadata.chunkIndex': 1 },
  { unique: true },
);

const ModelInstance = (mongoose.models['DocumentChunk'] ||
  mongoose.model<IDocumentChunkDocument>(
    'DocumentChunk',
    documentChunkSchema,
  )) as Model<IDocumentChunkDocument>;

export { ModelInstance as DocumentChunkModel };
