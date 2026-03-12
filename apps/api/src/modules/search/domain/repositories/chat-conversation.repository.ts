import type {
  ChatConversationEntity,
  ChatConversationEntityProps,
} from '../entities/chat-conversation.entity';

export abstract class IChatConversationRepository {
  abstract findById(
    id: string,
    userId: string,
  ): Promise<ChatConversationEntity | null>;
  abstract findAll(userId: string): Promise<ChatConversationEntity[]>;
  abstract create(
    data: Partial<ChatConversationEntityProps>,
  ): Promise<ChatConversationEntity>;
  abstract update(
    id: string,
    userId: string,
    data: Partial<ChatConversationEntityProps>,
  ): Promise<ChatConversationEntity | null>;
  abstract delete(id: string, userId: string): Promise<boolean>;
  abstract deleteAll(userId: string): Promise<void>;
}
