import type { Document } from 'mongoose';

export type ChatMessageRole = 'user' | 'assistant';
export type ChatMessageStatus = 'completed' | 'error';

export interface IChatSourceRef {
  documentId: string;
  title: string;
  author: string | null;
  publishedAt: string | null;
  originalSource: string | null;
}

export interface IChatMessage {
  role: ChatMessageRole;
  content: string;
  status: ChatMessageStatus;
  sources: IChatSourceRef[];
  tokensUsed: number;
  createdAt: Date;
}

export interface IChatConversation {
  userId: string;
  title: string;
  documentIds: string[];
  lastMessagePreview?: string | null;
  messages: IChatMessage[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type IChatConversationDocument = IChatConversation & Document;
