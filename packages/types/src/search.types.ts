export type SearchMode = 'normal' | 'ai';

export type ChatMessageRole = 'user' | 'assistant';
export type ChatMessageStatus = 'completed' | 'error';

export interface SourceRef {
  documentId: string;
  title: string;
  author: string | null;
  publishedAt: string | null;
  originalSource: string | null;
}

export interface SemanticSearchResult {
  documentId: string;
  title: string;
  type: string;
  status: string;
  score: number;
  preview: string;
  tags?: string[];
  createdAt: string | Date;
}

export interface SearchResultsData<TItem = unknown> {
  items: TItem[];
  total: number;
  page: number;
  limit: number;
  mode: SearchMode;
}

export interface ChatMessageView {
  id: string;
  role: ChatMessageRole;
  content: string;
  status: ChatMessageStatus;
  sources: SourceRef[];
  tokensUsed: number;
  createdAt: string;
}

export interface ChatConversationSummary {
  id: string;
  title: string;
  documentIds: string[];
  messageCount: number;
  lastMessagePreview: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatConversationDetail extends ChatConversationSummary {
  messages: ChatMessageView[];
}

export interface AskResult {
  conversationId: string;
  answer: string;
  sources: SourceRef[];
  tokensUsed: number;
}
