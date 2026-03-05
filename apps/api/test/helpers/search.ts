export interface SearchResult {
  documentId: string;
  title: string;
  score: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  mode: 'normal' | 'ai';
}

export interface AskSource {
  documentId: string;
  title: string;
  score: number;
}

export interface AskResponse {
  answer: string;
  sources: AskSource[];
}

export function isSearchResponse(body: unknown): body is SearchResponse {
  if (typeof body !== 'object' || body === null) return false;
  if (!('total' in body) || typeof body.total !== 'number') return false;
  if (!('mode' in body) || typeof body.mode !== 'string') return false;

  // Normal search returns 'documents', AI search returns 'results'
  const hasResults = 'results' in body && Array.isArray(body.results);
  const hasDocuments = 'documents' in body && Array.isArray(body.documents);
  return hasResults || hasDocuments;
}

export function isAskResponse(body: unknown): body is AskResponse {
  if (typeof body !== 'object' || body === null) return false;
  return (
    'answer' in body && typeof body.answer === 'string' &&
    'sources' in body && Array.isArray(body.sources)
  );
}
