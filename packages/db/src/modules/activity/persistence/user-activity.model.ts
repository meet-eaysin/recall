import type { Model } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import type { IUserActivityDocument } from '../types/user-activity.type';

const userActivitySchema = new Schema<IUserActivityDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    action: { type: String, required: true, index: true },
    targetType: { type: String, required: true, index: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const UserActivityModel: Model<IUserActivityDocument> =
  mongoose.models['UserActivity'] ||
  mongoose.model<IUserActivityDocument>('UserActivity', userActivitySchema);
