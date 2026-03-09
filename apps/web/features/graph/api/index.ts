import { apiGet, apiPost } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import type { DocumentSubgraphData, FullGraphData } from '../types';

export const graphApi = {
  getDocumentSubgraph: (id: string) =>
    apiGet<DocumentSubgraphData>(API_ENDPOINTS.GRAPH.document(id)),
  getFullGraph: () => apiGet<FullGraphData>(API_ENDPOINTS.GRAPH.FULL),
  rebuildDocumentGraph: (id: string) =>
    apiPost<string>(API_ENDPOINTS.GRAPH.rebuild(id)),
};
