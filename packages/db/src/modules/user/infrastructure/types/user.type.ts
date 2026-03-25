import { Document } from 'mongoose';
import { LLMUserSettings, UserConsent } from '@repo/types';

export interface IUser extends UserConsent {
  email: string;
  name: string;
  avatarUrl?: string;
  authId: string; // From external provider
  llmUserSettings?: LLMUserSettings;
  createdAt: Date;
  updatedAt: Date;
}

export type IUserDocument = IUser & Document;
