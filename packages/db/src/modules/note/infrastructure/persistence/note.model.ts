import type { Model } from 'mongoose';
import { model, models, Schema } from 'mongoose';
import type { INoteDocument } from '../types/note.type';

const noteSchema = new Schema<INoteDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', index: true },
    content: { type: String, required: true },
  },
  { timestamps: true },
);

export const NoteModel: Model<INoteDocument> =
  models.Note || model<INoteDocument>('Note', noteSchema);
