import { Document, Types } from 'mongoose';
import { GraphNodeType } from '@repo/types';

export interface IGraphNode {
  userId: Types.ObjectId;
  documentId?: Types.ObjectId; // Optional for root nodes
  label: string;
  type: GraphNodeType;
  properties: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type IGraphNodeDocument = IGraphNode & Document;
