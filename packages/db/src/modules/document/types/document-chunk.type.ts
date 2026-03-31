import type { Document, Types } from 'mongoose';

export interface IDocumentChunk {
  documentId: Types.ObjectId;
  userId: Types.ObjectId;
  content: string;
  index: number;
  tokenCount: number;
  embedding?: number[];
  metadata: {
    pageNumber?: number;
    chunkIndex: number;
    heading?: string;
    [key: string]: unknown;
  };
  createdAt: Date;
}

export type IDocumentChunkDocument = IDocumentChunk & Document;
