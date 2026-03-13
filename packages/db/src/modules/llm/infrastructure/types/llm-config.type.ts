import { Document, Types } from 'mongoose';

export interface ILLMConfig {
  userId: Types.ObjectId;
  provider: 'openai' | 'anthropic' | 'ollama';
  chatModel: string;
  embeddingModel: string;
  apiKey?: string;
  baseUrl?: string;
  capabilities: {
    chat: boolean;
    embeddings: boolean;
  };
  validatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ILLMConfigDocument = ILLMConfig & Document;
