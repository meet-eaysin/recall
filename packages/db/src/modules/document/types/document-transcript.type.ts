import { Document, Types } from 'mongoose';

export interface IDocumentTranscript {
  documentId: Types.ObjectId;
  content: string;
  segments: {
    start: number;
    end: number;
    text: string;
    speaker?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export type IDocumentTranscriptDocument = IDocumentTranscript & Document;
