import { Document } from 'mongoose';

export interface ITag {
  userId: string;
  name: string;
  source?: string | undefined;
  color?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export type ITagDocument = ITag & Document;
