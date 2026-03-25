import type { Model } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import type { ILegalDocumentDocument } from '../types/legal-document.type';

const legalDocumentSchema = new Schema<ILegalDocumentDocument>(
  {
    type: {
      type: String,
      enum: ['privacy', 'cookie'],
      required: true,
      index: true,
    },
    version: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    effectiveDate: { type: Date, required: true },
  },
  { timestamps: true },
);

legalDocumentSchema.index({ type: 1, version: 1 }, { unique: true });

export const LegalDocumentModel: Model<ILegalDocumentDocument> =
  (mongoose.models['LegalDocument'] as Model<ILegalDocumentDocument> | undefined) ??
  mongoose.model<ILegalDocumentDocument>('LegalDocument', legalDocumentSchema);
