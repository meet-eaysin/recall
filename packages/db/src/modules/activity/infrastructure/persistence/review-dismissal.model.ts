import type { Model } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import type { IReviewDismissalDocument } from '../types/review-dismissal.type';

const reviewDismissalSchema = new Schema<IReviewDismissalDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    targetType: {
      type: String,
      enum: ['document', 'note', 'graph-node'],
      required: true,
      index: true,
    },
    date: { type: String, required: true, index: true },
    reason: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

reviewDismissalSchema.index(
  { userId: 1, targetId: 1, date: 1 },
  { unique: true },
);
reviewDismissalSchema.index({ createdAt: 1 }, { expireAfterSeconds: 172800 });

export const ReviewDismissalModel: Model<IReviewDismissalDocument> =
  mongoose.models['ReviewDismissal'] ||
  mongoose.model<IReviewDismissalDocument>(
    'ReviewDismissal',
    reviewDismissalSchema,
  );
