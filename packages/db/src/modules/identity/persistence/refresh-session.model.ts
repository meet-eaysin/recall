import type { Model } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import type { IRefreshSessionDocument } from '../types/refresh-session.type';

const refreshSessionSchema = new Schema<IRefreshSessionDocument>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: { type: String, required: true, unique: true, index: true },
    userAgent: { type: String },
    ipAddress: { type: String },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, index: true },
  },
  { timestamps: true },
);

refreshSessionSchema.index({ userId: 1, revokedAt: 1 });

export const RefreshSessionModel: Model<IRefreshSessionDocument> =
  (mongoose.models['RefreshSession'] as
    | Model<IRefreshSessionDocument>
    | undefined) ??
  mongoose.model<IRefreshSessionDocument>(
    'RefreshSession',
    refreshSessionSchema,
  );
