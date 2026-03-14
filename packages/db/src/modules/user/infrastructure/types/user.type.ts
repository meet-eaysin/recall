import { Document } from 'mongoose';
import { LLMConfig } from '@repo/types';

export interface IUser {
  email: string;
  name: string;
  avatarUrl?: string;
  authId: string; // From external provider
  llmConfig?: LLMConfig;
  createdAt: Date;
  updatedAt: Date;
}

export type IUserDocument = IUser & Document;
