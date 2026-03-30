import { Document, Types } from 'mongoose';

export interface IUserActivity {
  userId: string;
  action: string;
  targetType: string;
  targetId: Types.ObjectId;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export type IUserActivityDocument = IUserActivity & Document;
