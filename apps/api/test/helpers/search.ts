export interface SearchResponse {
  documents?: any[];
  results?: any[];
  total: number;
  mode: 'normal' | 'ai';
}

export interface AskResponse {
  answer: string;
  sources: any[];
  tokensUsed: number;
}

export function isSearchResponse(body: unknown): body is SearchResponse {
  if (typeof body !== 'object' || body === null) return false;
  return 'total' in body && typeof body.total === 'number' && 'mode' in body;
}

export function isAskResponse(body: unknown): body is AskResponse {
  if (typeof body !== 'object' || body === null) return false;
  return 'answer' in body && typeof body.answer === 'string' && 'sources' in body;
}
