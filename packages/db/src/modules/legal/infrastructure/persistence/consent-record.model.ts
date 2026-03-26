import type { Model } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import type { IConsentRecordDocument } from '../types/consent-record.type';

const consentRecordSchema = new Schema<IConsentRecordDocument>(
  {
    userId: { type: String, index: true },
    anonymousId: { type: String, index: true },
    policyVersions: {
      type: Map,
      of: String,
      required: true,
    },
    categories: {
      type: [String],
      enum: ['necessary', 'analytics', 'marketing'],
      required: true,
    },
    ip: { type: String, required: true },
    userAgent: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

consentRecordSchema.index({ userId: 1, timestamp: -1 });
consentRecordSchema.index({ anonymousId: 1, timestamp: -1 });

export const ConsentRecordModel: Model<IConsentRecordDocument> =
  (mongoose.models['ConsentRecord'] as Model<IConsentRecordDocument> | undefined) ??
  mongoose.model<IConsentRecordDocument>('ConsentRecord', consentRecordSchema);
