export enum GraphNodeType {
  ROOT = 'root',
  DOCUMENT = 'document',
  CONCEPT = 'concept',
}

export enum GraphRelationType {
  SEMANTIC_SIMILARITY = 'semantic_similarity',
  TOPICAL = 'topical',
  SHARED_TAGS = 'shared_tags',
  ROOT_CONNECTION = 'root_connection',
}

export enum GraphGenerationMethod {
  SEMANTIC_SIMILARITY = 'semantic_similarity',
  TOPICAL = 'topical',
  SHARED_TAGS = 'shared_tags',
  ROOT_CONNECTION = 'root_connection',
}

export interface GraphNodeView {
  id: string;
  type: string;
  documentId?: string | undefined;
  label: string;
}

export interface GraphNodeEntityProps {
  id: string;
  userId: string;
  type: GraphNodeType;
  documentId?: string | undefined;
  label: string;
  createdAt: Date;
  updatedAt: Date;
  properties?: Record<string, unknown>;
}

export interface GraphEdgeView {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  relationType: string;
  weight: number;
}

export interface GraphEdgeEntityProps {
  id: string;
  userId: string;
  fromNodeId: string;
  toNodeId: string;
  relationType: GraphRelationType;
  weight: number;
  generationMethod: GraphGenerationMethod;
  createdAt: Date;
  updatedAt: Date;
  properties?: Record<string, unknown>;
}
