import mongoose, { Schema } from 'mongoose';
import type { IGraphNodeDocument } from '../types/graph-node.type';

const graphNodeSchema = new Schema<IGraphNodeDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: false,
      index: true,
    },
    label: { type: String, required: true, index: true },
    type: { type: String, required: true, index: true },
    properties: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export const GraphNodeModel: mongoose.Model<IGraphNodeDocument> =
  mongoose.models['GraphNode'] ||
  mongoose.model<IGraphNodeDocument>('GraphNode', graphNodeSchema);
