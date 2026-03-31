import { Document, Types } from 'mongoose';

export type ExternalAuthProvider = 'google' | 'github';

export interface IExternalIdentity {
  userId: Types.ObjectId;
  provider: ExternalAuthProvider;
  providerUserId: string;
  email?: string;
  emailVerified: boolean;
  profileSnapshot?: Record<string, unknown>;
  linkedAt: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type IExternalIdentityDocument = IExternalIdentity & Document;
