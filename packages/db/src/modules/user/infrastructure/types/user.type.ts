import { LLMUserSettings } from '@repo/types';

export interface IUser {
  email: string;
  name: string;
  avatarUrl?: string;
  authId: string; // From external provider
  llmUserSettings?: LLMUserSettings;
  createdAt: Date;
  updatedAt: Date;
}

export type IUserDocument = IUser & import('mongoose').Document;
