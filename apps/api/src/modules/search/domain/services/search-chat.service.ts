import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  ChatConversationDetail,
  ChatConversationSummary,
  ChatMessageView,
} from '@repo/types';
import { IChatConversationRepository } from '../repositories/chat-conversation.repository';
import type {
  ChatConversationEntity,
  ChatMessageProps,
} from '../entities/chat-conversation.entity';
import type { IChatSourceRef } from '@repo/db';

type PromptMessage = {
  role: 'user' | 'assistant';
  content: string;
};

@Injectable()
export class SearchChatService {
  private static readonly MAX_HISTORY_MESSAGES = 6;

  constructor(private readonly chatRepository: IChatConversationRepository) {}

  async createConversation(
    userId: string,
    question: string,
    documentIds?: string[],
  ): Promise<ChatConversationEntity> {
    const conversation = await this.chatRepository.create({
      userId,
      title: this.buildTitle(question),
      documentIds: documentIds ?? [],
      messages: [],
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return conversation;
  }

  async getConversationForUser(
    userId: string,
    conversationId: string,
  ): Promise<ChatConversationEntity> {
    const conversation = await this.chatRepository.findById(
      conversationId,
      userId,
    );
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }

  async getPromptHistory(
    userId: string,
    conversationId?: string,
  ): Promise<PromptMessage[]> {
    if (!conversationId) return [];

    const conversation = await this.getConversationForUser(
      userId,
      conversationId,
    );
    const recentMessages = conversation.props.messages.slice(
      -SearchChatService.MAX_HISTORY_MESSAGES,
    );

    return recentMessages.map((message) => ({
      role: message.role,
      content: message.content,
    }));
  }

  async listConversations(userId: string): Promise<ChatConversationSummary[]> {
    const conversations = await this.chatRepository.findAll(userId);
    return conversations.map((conversation) =>
      this.toConversationSummary(conversation),
    );
  }

  async getConversationDetail(
    userId: string,
    conversationId: string,
  ): Promise<ChatConversationDetail> {
    const conversation = await this.getConversationForUser(
      userId,
      conversationId,
    );

    return {
      id: conversation.id,
      title: conversation.title,
      documentIds: conversation.props.documentIds ?? [],
      messageCount: conversation.props.messages.length,
      lastMessagePreview: conversation.props.lastMessagePreview ?? null,
      createdAt: conversation.props.createdAt.toISOString(),
      updatedAt: conversation.props.updatedAt.toISOString(),
      messages: conversation.props.messages.map((message) =>
        this.toMessageView(message),
      ),
      isArchived: conversation.isArchived,
    };
  }

  async deleteConversation(
    userId: string,
    conversationId: string,
  ): Promise<void> {
    const deleted = await this.chatRepository.delete(conversationId, userId);
    if (!deleted) {
      throw new NotFoundException('Conversation not found');
    }
  }

  async archiveConversation(
    userId: string,
    conversationId: string,
    isArchived = true,
  ): Promise<ChatConversationDetail> {
    const updated = await this.chatRepository.update(conversationId, userId, {
      isArchived,
      updatedAt: new Date(),
    });

    if (!updated) {
      throw new NotFoundException('Conversation not found');
    }

    return this.getConversationDetail(userId, conversationId);
  }

  async clearHistory(userId: string): Promise<void> {
    await this.chatRepository.deleteAll(userId);
  }

  async appendExchange(params: {
    answer: string;
    conversationId: string;
    documentIds?: string[];
    question: string;
    sources: IChatSourceRef[];
    status?: 'completed' | 'error';
    tokensUsed: number;
    userId: string;
  }): Promise<ChatConversationDetail> {
    const conversation = await this.getConversationForUser(
      params.userId,
      params.conversationId,
    );

    const messages = [...conversation.props.messages];
    messages.push({
      id: '', // Server will handle
      role: 'user',
      content: params.question,
      status: 'completed',
      sources: [],
      tokensUsed: 0,
      createdAt: new Date(),
    });
    messages.push({
      id: '', // Server will handle
      role: 'assistant',
      content: params.answer,
      status: params.status ?? 'completed',
      sources: params.sources,
      tokensUsed: params.tokensUsed,
      createdAt: new Date(),
    });

    await this.chatRepository.update(params.conversationId, params.userId, {
      messages,
      documentIds: params.documentIds ?? conversation.props.documentIds,
      lastMessagePreview: this.buildPreview(params.answer),
      updatedAt: new Date(),
    });

    return this.getConversationDetail(params.userId, params.conversationId);
  }

  private buildTitle(question: string): string {
    const normalized = question.replace(/\s+/g, ' ').trim();
    return normalized.slice(0, 80) || 'Untitled conversation';
  }

  private buildPreview(content: string): string | null {
    const normalized = content.replace(/\s+/g, ' ').trim();
    return normalized.slice(0, 140) || null;
  }

  private toConversationSummary(
    conversation: ChatConversationEntity,
  ): ChatConversationSummary {
    return {
      id: conversation.id,
      title: conversation.title,
      documentIds: conversation.props.documentIds ?? [],
      messageCount: conversation.props.messages.length,
      lastMessagePreview: conversation.props.lastMessagePreview ?? null,
      createdAt: conversation.props.createdAt.toISOString(),
      updatedAt: conversation.props.updatedAt.toISOString(),
      isArchived: conversation.isArchived,
    };
  }

  private toMessageView(message: ChatMessageProps): ChatMessageView {
    return {
      id: message.id,
      role: message.role,
      content: message.content,
      status: message.status,
      sources: message.sources,
      tokensUsed: message.tokensUsed,
      createdAt: message.createdAt.toISOString(),
    };
  }
}
