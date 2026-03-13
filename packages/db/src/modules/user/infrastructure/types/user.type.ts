import { Document } from 'mongoose';

export interface IUser {
  email: string;
  name: string;
  avatarUrl?: string;
  authId: string; // From external provider
  createdAt: Date;
  updatedAt: Date;
}

export type IUserDocument = IUser & Document;
