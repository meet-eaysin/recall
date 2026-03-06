import { isObject } from './common';

export interface SearchResult {
  documentId: string;
  title: string;
  score: number;
}

export interface SearchResponse {
  success: boolean;
  data: {
    items: SearchResult[];
    total: number;
    page: number;
    limit: number;
    mode: 'normal' | 'ai';
  };
}

export interface AskSource {
  documentId: string;
  title: string;
  score: number;
}

export interface AskResponse {
  success: boolean;
  data: {
    answer: string;
    sources: AskSource[];
    tokensUsed: number;
  };
}

export function isSearchResponse(body: unknown): body is SearchResponse {
  if (!isObject(body)) return false;
  if (body.success !== true) return false;
  if (!isObject(body.data)) return false;

  const data = body.data;
  return (
    typeof data.total === 'number' &&
    typeof data.mode === 'string' &&
    Array.isArray(data.items)
  );
}

export function isAskResponse(body: unknown): body is AskResponse {
  if (!isObject(body)) return false;
  if (body.success !== true) return false;
  if (!isObject(body.data)) return false;

  const data = body.data;
  return typeof data.answer === 'string' && Array.isArray(data.sources);
}
