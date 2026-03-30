import type { Model } from 'mongoose';
import { model, models, Schema } from 'mongoose';
import type { IFolderDocument } from '../types/folder.type';

const folderSchema = new Schema<IFolderDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    parentId: { type: Schema.Types.ObjectId, ref: 'Folder', index: true },
    name: { type: String, required: true, index: true },
    description: { type: String },
    color: { type: String },
  },
  { timestamps: true },
);

folderSchema.index({ userId: 1, name: 1, parentId: 1 }, { unique: true });

export const FolderModel: Model<IFolderDocument> =
  models.Folder || model<IFolderDocument>('Folder', folderSchema);
