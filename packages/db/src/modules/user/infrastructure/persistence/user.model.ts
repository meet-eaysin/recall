import type { Model } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import type { IUserDocument } from '../types/user.type';

const userSchema = new Schema<IUserDocument>(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    avatarUrl: { type: String },
    authId: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true },
);

export const UserModel: Model<IUserDocument> =
  (mongoose.models['User'] as Model<IUserDocument> | undefined) ??
  mongoose.model<IUserDocument>('User', userSchema);
