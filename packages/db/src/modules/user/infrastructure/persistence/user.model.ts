import type { Model } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import type { IUserDocument } from '../types/user.type';
import type { LLMConfig } from '@repo/types';

// The shape stored on the User
const llmConfigSchema = new Schema<LLMConfig>(
  {
    providerId: { type: String },
    modelId: { type: String },
    embeddingModelId: { type: String },
    apiKey: { type: String },
    useSystemDefault: { type: Boolean, default: true },
  },
  { _id: false }
);

const userSchema = new Schema<IUserDocument>(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    avatarUrl: { type: String },
    authId: { type: String, required: true, unique: true, index: true },
    llmConfig: { type: llmConfigSchema },
  },
  { timestamps: true },
);

export const UserModel: Model<IUserDocument> =
  (mongoose.models['User'] as Model<IUserDocument> | undefined) ??
  mongoose.model<IUserDocument>('User', userSchema);
