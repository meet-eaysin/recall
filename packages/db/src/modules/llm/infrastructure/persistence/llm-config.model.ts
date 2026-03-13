import type { Model } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import type { ILLMConfigDocument } from '../types/llm-config.type';

const llmConfigSchema = new Schema<ILLMConfigDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['openai', 'anthropic', 'ollama'],
      required: true,
    },
    chatModel: { type: String, required: true },
    embeddingModel: { type: String, required: true },
    apiKey: { type: String },
    baseUrl: { type: String },
    capabilities: {
      chat: { type: Boolean, default: false },
      embeddings: { type: Boolean, default: false },
    },
    validatedAt: { type: Date },
  },
  { timestamps: true },
);

export const LLMConfigModel: Model<ILLMConfigDocument> =
  (mongoose.models['LLMConfig'] as Model<ILLMConfigDocument> | undefined) ??
  mongoose.model<ILLMConfigDocument>('LLMConfig', llmConfigSchema);
