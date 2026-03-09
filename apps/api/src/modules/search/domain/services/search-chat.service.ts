import {
  ChatConversationModel,
  type IChatConversationDocument,
  type IChatSourceRef,
} from '@repo/db';
import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  ChatConversationDetail,
  ChatConversationSummary,
  ChatMessageView,
} from '@repo/types';

type PromptMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type LeanConversation = {
  _id?: { toString(): string } | string;
  title?: string;
  documentIds?: string[];
  lastMessagePreview?: string | null;
  messages?: Array<{
    role: 'user' | 'assistant';
    content: string;
    status: 'completed' | 'error';
    sources: IChatSourceRef[];
    tokensUsed: number;
    createdAt: Date | string;
  }>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

@Injectable()
export class SearchChatService {
  private static readonly MAX_HISTORY_MESSAGES = 6;

  async createConversation(
    userId: string,
    question: string,
    documentIds?: string[],
  ): Promise<IChatConversationDocument> {
    const conversation = await ChatConversationModel.create({
      documentIds: documentIds ?? [],
      title: this.buildTitle(question),
      userId,
    });

    return conversation;
  }

  async getConversationForUser(
    userId: string,
    conversationId: string,
  ): Promise<IChatConversationDocument> {
    const conversation = await ChatConversationModel.findOne({
      _id: conversationId,
      userId,
    }).exec();

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
    const recentMessages = conversation.messages.slice(
      -SearchChatService.MAX_HISTORY_MESSAGES,
    );

    return recentMessages.map((message) => ({
      role: message.role,
      content: message.content,
    }));
  }

  async listConversations(userId: string): Promise<ChatConversationSummary[]> {
    const conversations = await ChatConversationModel.find({ userId })
      .sort({ updatedAt: -1 })
      .lean()
      .exec();

    return conversations.map((conversation) =>
      this.toConversationSummary(conversation as LeanConversation),
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
      id: this.getConversationId(conversation),
      title: conversation.title,
      documentIds: conversation.documentIds ?? [],
      messageCount: conversation.messages.length,
      lastMessagePreview: conversation.lastMessagePreview ?? null,
      createdAt: this.toIsoString(conversation.createdAt),
      updatedAt: this.toIsoString(conversation.updatedAt),
      messages: conversation.messages.map((message) =>
        this.toMessageView(message),
      ),
    };
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

    if (params.documentIds && params.documentIds.length > 0) {
      conversation.documentIds = params.documentIds;
    }

    conversation.messages.push({
      role: 'user',
      content: params.question,
      status: 'completed',
      sources: [],
      tokensUsed: 0,
      createdAt: new Date(),
    });
    conversation.messages.push({
      role: 'assistant',
      content: params.answer,
      status: params.status ?? 'completed',
      sources: params.sources,
      tokensUsed: params.tokensUsed,
      createdAt: new Date(),
    });
    conversation.lastMessagePreview = this.buildPreview(params.answer);
    conversation.updatedAt = new Date();

    await conversation.save();

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

  private getConversationId(conversation: IChatConversationDocument): string {
    if (typeof conversation.id === 'string' && conversation.id.length > 0) {
      return conversation.id;
    }

    const rawId = (
      conversation as unknown as { _id?: { toString(): string } | string }
    )._id;

    if (typeof rawId === 'string' && rawId.length > 0) {
      return rawId;
    }

    if (rawId && typeof rawId.toString === 'function') {
      return rawId.toString();
    }

    throw new Error('Conversation id is missing');
  }

  private toIsoString(value: Date | string | undefined): string {
    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === 'string') {
      return new Date(value).toISOString();
    }

    throw new Error('Expected a date value');
  }

  private toConversationSummary(
    conversation: LeanConversation,
  ): ChatConversationSummary {
    return {
      id: this.getLeanConversationId(conversation),
      title: conversation.title ?? 'Untitled conversation',
      documentIds: conversation.documentIds ?? [],
      messageCount: conversation.messages?.length ?? 0,
      lastMessagePreview: conversation.lastMessagePreview ?? null,
      createdAt: this.toIsoString(conversation.createdAt),
      updatedAt: this.toIsoString(conversation.updatedAt),
    };
  }

  private getLeanConversationId(conversation: LeanConversation): string {
    if (typeof conversation._id === 'string' && conversation._id.length > 0) {
      return conversation._id;
    }

    if (conversation._id && typeof conversation._id.toString === 'function') {
      return conversation._id.toString();
    }

    throw new Error('Conversation id is missing');
  }

  private toMessageView(
    message: IChatConversationDocument['messages'][number],
  ): ChatMessageView {
    const messageId =
      'id' in message && typeof message.id === 'string'
        ? message.id
        : String(
            (
              message as unknown as {
                _id?: { toString(): string };
              }
            )._id?.toString() ?? '',
          );

    return {
      id: messageId,
      role: message.role,
      content: message.content,
      status: message.status,
      sources: message.sources,
      tokensUsed: message.tokensUsed,
      createdAt: this.toIsoString(message.createdAt),
    };
  }
}
