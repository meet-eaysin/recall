import type { ChatSourceRef } from '../types/chat-source-ref.type';

export interface ChatMessageProps {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status: 'completed' | 'error';
  sources: ChatSourceRef[];
  tokensUsed: number;
  createdAt: Date;
}

export interface ChatConversationEntityProps {
  id: string;
  userId: string;
  title: string;
  documentIds: string[];
  lastMessagePreview?: string | null;
  messages: ChatMessageProps[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ChatConversationEntity {
  constructor(public readonly props: ChatConversationEntityProps) {}

  static create(props: ChatConversationEntityProps): ChatConversationEntity {
    return new ChatConversationEntity(props);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get title(): string {
    return this.props.title;
  }

  get isArchived(): boolean {
    return this.props.isArchived;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
