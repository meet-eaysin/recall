import { Document, Types } from 'mongoose';

export interface IFolder {
  userId: string;
  parentId?: Types.ObjectId | undefined;
  name: string;
  description?: string | undefined;
  color?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export type IFolderDocument = IFolder & Document;
