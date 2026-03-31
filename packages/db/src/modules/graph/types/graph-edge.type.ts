import { GraphGenerationMethod, GraphRelationType } from '@repo/types';
import { Document, Types } from 'mongoose';

export interface IGraphEdge {
  userId: Types.ObjectId;
  fromNodeId: Types.ObjectId;
  toNodeId: Types.ObjectId;
  relationType: GraphRelationType;
  weight: number;
  generationMethod: GraphGenerationMethod;
  properties: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type IGraphEdgeDocument = IGraphEdge & Document;
