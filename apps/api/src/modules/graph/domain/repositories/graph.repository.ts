import type { GraphNodeEntity } from '../entities/graph-node.entity';
import type { GraphEdgeEntity } from '../entities/graph-edge.entity';
import type { GraphRelationType, GraphGenerationMethod } from '@repo/types';

export interface UpsertEdgeData {
  userId: string;
  fromNodeId: string;
  toNodeId: string;
  relationType: GraphRelationType;
  weight: number;
  generationMethod: GraphGenerationMethod;
}

export abstract class IGraphRepository {
  abstract findRootNode(userId: string): Promise<GraphNodeEntity | null>;
  abstract createRootNode(
    userId: string,
    label: string,
  ): Promise<GraphNodeEntity>;
  abstract upsertDocumentNode(
    userId: string,
    documentId: string,
    label: string,
  ): Promise<GraphNodeEntity>;
  abstract findNodeByDocumentId(
    userId: string,
    documentId: string,
  ): Promise<GraphNodeEntity | null>;
  abstract upsertEdge(data: UpsertEdgeData): Promise<GraphEdgeEntity>;
  abstract findAllNodes(userId: string): Promise<GraphNodeEntity[]>;
  abstract findAllEdges(userId: string): Promise<GraphEdgeEntity[]>;
  abstract findDirectEdges(
    nodeId: string,
    userId: string,
  ): Promise<GraphEdgeEntity[]>;
  abstract findNodesByIds(nodeIds: string[]): Promise<GraphNodeEntity[]>;
  abstract deleteNodeForDocument(
    documentId: string,
    userId: string,
  ): Promise<void>;
  abstract deleteEdgesForDocument(
    documentId: string,
    userId: string,
  ): Promise<void>;
}
