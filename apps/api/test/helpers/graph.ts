import { TEST_USER_ID } from './common';

export interface GraphNodeResponse {
  id: string;
  label: string;
  type: string;
  documentId?: string;
}

export interface GraphEdgeResponse {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  relationType: string;
  weight: number;
}

export interface FullGraphResponse {
  success: boolean;
  data: {
    nodes: GraphNodeResponse[];
    edges: GraphEdgeResponse[];
    rootNodeId: string;
  };
}

export interface DocumentSubgraphResponse {
  success: boolean;
  data: {
    node: GraphNodeResponse;
    directEdges: GraphEdgeResponse[];
    neighborNodes: GraphNodeResponse[];
  };
}

export interface RebuildGraphResponse {
  success: boolean;
  data: string;
}

function isGraphNode(node: unknown): node is GraphNodeResponse {
  if (typeof node !== 'object' || node === null) return false;
  return 'id' in node && typeof node.id === 'string' &&
         'label' in node && typeof node.label === 'string' &&
         'type' in node && typeof node.type === 'string';
}

function isGraphEdge(edge: unknown): edge is GraphEdgeResponse {
  if (typeof edge !== 'object' || edge === null) return false;
  return 'id' in edge && typeof edge.id === 'string' &&
         'fromNodeId' in edge && typeof edge.fromNodeId === 'string' &&
         'toNodeId' in edge && typeof edge.toNodeId === 'string' &&
         'relationType' in edge && typeof edge.relationType === 'string' &&
         'weight' in edge && typeof edge.weight === 'number';
}

export function isFullGraphResponse(body: unknown): body is FullGraphResponse {
  if (typeof body !== 'object' || body === null) return false;
  if (!('success' in body) || body.success !== true) return false;
  if (!('data' in body) || typeof body.data !== 'object' || body.data === null) return false;
  
  const { data } = body;
  if (!('nodes' in data) || !Array.isArray(data.nodes) || !data.nodes.every(isGraphNode)) return false;
  if (!('edges' in data) || !Array.isArray(data.edges) || !data.edges.every(isGraphEdge)) return false;
  if (!('rootNodeId' in data) || typeof data.rootNodeId !== 'string') return false;
  
  return true;
}

export function isDocumentSubgraphResponse(body: unknown): body is DocumentSubgraphResponse {
  if (typeof body !== 'object' || body === null) return false;
  if (!('success' in body) || body.success !== true) return false;
  if (!('data' in body) || typeof body.data !== 'object' || body.data === null) return false;
  
  const { data } = body;
  if (!('node' in data) || !isGraphNode(data.node)) return false;
  if (!('directEdges' in data) || !Array.isArray(data.directEdges) || !data.directEdges.every(isGraphEdge)) return false;
  if (!('neighborNodes' in data) || !Array.isArray(data.neighborNodes) || !data.neighborNodes.every(isGraphNode)) return false;
  
  return true;
}

export function isRebuildGraphResponse(body: unknown): body is RebuildGraphResponse {
  if (typeof body !== 'object' || body === null) return false;
  if (!('success' in body) || body.success !== true) return false;
  if (!('data' in body) || typeof body.data !== 'string') return false;
  
  return true;
}

export async function seedGraphNode(
  label: string,
  type: string,
  documentId?: string,
  userId: string = TEST_USER_ID
): Promise<string> {
  const { GraphNodeModel } = await import('@repo/db');
  const properties = documentId ? { documentId } : {};
  const node = new GraphNodeModel({ label, type, userId, documentId, properties });
  const saved = await node.save();
  return saved._id.toString();
}

export async function seedGraphEdge(
  fromNodeId: string,
  toNodeId: string,
  relationType: string,
  weight: number = 1,
  userId: string = TEST_USER_ID,
  generationMethod: string = 'semantic_similarity'
): Promise<string> {
  const { GraphEdgeModel } = await import('@repo/db');
  const edge = new GraphEdgeModel({ fromNodeId, toNodeId, relationType, weight, generationMethod, userId });
  const saved = await edge.save();
  return saved._id.toString();
}
