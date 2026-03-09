import type { GraphNodeType, GraphRelationType } from '@repo/types';

export interface GraphNodeRow {
  id: string;
  label: string;
  type: GraphNodeType;
  documentId?: string | undefined;
}

export interface GraphEdgeRow {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  relationType: GraphRelationType;
  weight: number;
}

export interface FullGraphData {
  nodes: GraphNodeRow[];
  edges: GraphEdgeRow[];
  rootNodeId: string;
}

export interface DocumentSubgraphData {
  node: GraphNodeRow;
  directEdges: GraphEdgeRow[];
  neighborNodes: GraphNodeRow[];
}
