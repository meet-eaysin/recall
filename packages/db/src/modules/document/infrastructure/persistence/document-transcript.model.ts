import mongoose, { Schema } from 'mongoose';
import type { IDocumentTranscriptDocument } from '../types/document-transcript.type';

const segmentSchema = new Schema(
  {
    start: { type: Number, required: true },
    end: { type: Number, required: true },
    text: { type: String, required: true },
    speaker: { type: String },
  },
  { _id: false },
);

const documentTranscriptSchema = new Schema<IDocumentTranscriptDocument>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      unique: true,
      index: true,
    },
    content: { type: String, required: true },
    segments: [segmentSchema],
  },
  { timestamps: true },
);

export const DocumentTranscriptModel: mongoose.Model<IDocumentTranscriptDocument> =
  mongoose.models['DocumentTranscript'] ||
  mongoose.model<IDocumentTranscriptDocument>(
    'DocumentTranscript',
    documentTranscriptSchema,
  );
