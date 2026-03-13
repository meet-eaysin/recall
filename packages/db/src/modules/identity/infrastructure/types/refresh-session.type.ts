import { Document, Types } from 'mongoose';

export interface IRefreshSession {
  sessionId: string;
  userId: Types.ObjectId;
  tokenHash: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type IRefreshSessionDocument = IRefreshSession & Document;
