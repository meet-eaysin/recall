import mongoose, { Schema } from 'mongoose';
import type { IGraphEdgeDocument } from '../types/graph-edge.type';

const graphEdgeSchema = new Schema<IGraphEdgeDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fromNodeId: {
      type: Schema.Types.ObjectId,
      ref: 'GraphNode',
      required: true,
      index: true,
    },
    toNodeId: {
      type: Schema.Types.ObjectId,
      ref: 'GraphNode',
      required: true,
      index: true,
    },
    relationType: { type: String, required: true, index: true },
    weight: { type: Number, required: true, default: 0 },
    generationMethod: {
      type: String,
      enum: [
        'semantic_similarity',
        'topical',
        'shared_tags',
        'root_connection',
      ],
      required: true,
    },
    properties: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

graphEdgeSchema.index(
  { fromNodeId: 1, toNodeId: 1, relationType: 1 },
  { unique: true },
);

export const GraphEdgeModel: mongoose.Model<IGraphEdgeDocument> =
  mongoose.models['GraphEdge'] ||
  mongoose.model<IGraphEdgeDocument>('GraphEdge', graphEdgeSchema);
