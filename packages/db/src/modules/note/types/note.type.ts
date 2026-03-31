import { Document, Types } from 'mongoose';

export interface INote {
  userId: string;
  documentId?: Types.ObjectId | undefined;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export type INoteDocument = INote & Document;
