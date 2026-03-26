import type { Model } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import type { IUserDocument } from '../types/user.type';
import type { LLMUserSettings, LLMConfig } from '@repo/types';

// The shape stored on the User
const llmConfigSchema = new Schema<LLMConfig>(
  {
    id: { type: String },
    providerId: { type: String, required: true },
    modelId: { type: String, required: true },
    embeddingModelId: { type: String },
    apiKey: { type: String },
    useSystemDefault: { type: Boolean, default: true },
  },
  { _id: false },
);

const llmUserSettingsSchema = new Schema<LLMUserSettings>(
  {
    configs: { type: [llmConfigSchema], default: [] },
    activeConfigId: { type: String },
  },
  { _id: false },
);

const userSchema = new Schema<IUserDocument>(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    avatarUrl: { type: String },
    authId: { type: String, required: true, unique: true, index: true },
    llmUserSettings: { type: llmUserSettingsSchema },
  },
  { timestamps: true },
);

export const UserModel: Model<IUserDocument> =
  (mongoose.models['User'] as Model<IUserDocument> | undefined) ??
  mongoose.model<IUserDocument>('User', userSchema);
