import { Document, Types } from 'mongoose';

export interface IReviewDismissal {
  userId: Types.ObjectId;
  targetId: Types.ObjectId;
  targetType: 'document' | 'note' | 'graph-node';
  date: string; // YYYY-MM-DD
  reason?: string;
  createdAt: Date;
}

export type IReviewDismissalDocument = IReviewDismissal & Document;
