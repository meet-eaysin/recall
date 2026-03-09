import type {
  AskResult,
  ChatConversationDetail,
  ChatConversationSummary,
  SearchResultsData,
  SemanticSearchResult,
  SourceRef,
} from '@repo/types';
import type { IDocumentView } from '@repo/types';

export type SearchFilters = {
  limit?: number;
  mode?: 'normal' | 'ai';
  page?: number;
  q: string;
  status?: string;
  type?: string;
};

export type SearchResultItem = IDocumentView | SemanticSearchResult;
export type SearchResultsResponse = SearchResultsData<SearchResultItem>;

export type AskInput = {
  conversationId?: string;
  documentIds?: string[];
  question: string;
};

export type AskStreamEvent =
  | { type: 'conversation'; conversationId: string }
  | { type: 'delta'; chunk: string }
  | { type: 'done'; data: AskResult }
  | { type: 'error'; message: string };

export type SearchChatSummary = ChatConversationSummary;
export type SearchChatConversation = ChatConversationDetail;
export type SearchChatSource = SourceRef;
