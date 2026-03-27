import type { Message, Source } from '@/components/ai/chat-message';
import type { SearchChatConversation } from '@/features/search/types';

function mapSources(
  sources: SearchChatConversation['messages'][number]['sources'] | undefined,
): Source[] | undefined {
  if (!sources || sources.length === 0) {
    return undefined;
  }

  return sources.map((source) => ({
    author: source.author,
    documentId: source.documentId,
    originalSource: source.originalSource,
    publishedAt: source.publishedAt,
    title: source.title,
  }));
}

export function mapConversationMessages(
  conversation: SearchChatConversation | null | undefined,
): Message[] {
  if (!conversation) {
    return [];
  }

  return conversation.messages.map((message) => ({
    content: message.content,
    createdAt: new Date(message.createdAt),
    id: message.id,
    role: message.role,
    sources: mapSources(message.sources),
  }));
}
