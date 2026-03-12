import { Injectable } from '@nestjs/common';
import {
  ChatConversationModel,
  type IChatConversationDocument,
} from '@repo/db';
import { IChatConversationRepository } from '../../domain/repositories/chat-conversation.repository';
import {
  ChatConversationEntity,
  type ChatConversationEntityProps,
} from '../../domain/entities/chat-conversation.entity';
import { Types } from 'mongoose';

@Injectable()
export class MongooseChatConversationRepository implements IChatConversationRepository {
  async findById(
    id: string,
    userId: string,
  ): Promise<ChatConversationEntity | null> {
    const doc = await ChatConversationModel.findOne({ _id: id, userId }).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async findAll(userId: string): Promise<ChatConversationEntity[]> {
    const docs = await ChatConversationModel.find({ userId })
      .sort({ updatedAt: -1 })
      .exec();
    return docs.map((doc) => this.toEntity(doc));
  }

  async create(
    data: Partial<ChatConversationEntityProps>,
  ): Promise<ChatConversationEntity> {
    const doc = await ChatConversationModel.create({
      ...data,
      _id: undefined, // Let mongoose generate it if not provided
    });
    return this.toEntity(doc);
  }

  async update(
    id: string,
    userId: string,
    data: Partial<ChatConversationEntityProps>,
  ): Promise<ChatConversationEntity | null> {
    const updateData = { ...data };
    delete updateData.id; // Ensure id is not updated in the document body

    const doc = await ChatConversationModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: updateData },
      { new: true, runValidators: true },
    ).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await ChatConversationModel.deleteOne({
      _id: id,
      userId,
    }).exec();
    return result.deletedCount > 0;
  }

  async deleteAll(userId: string): Promise<void> {
    await ChatConversationModel.deleteMany({ userId }).exec();
  }

  private toEntity(doc: IChatConversationDocument): ChatConversationEntity {
    return ChatConversationEntity.create({
      id:
        doc._id instanceof Types.ObjectId
          ? doc._id.toHexString()
          : String(doc._id),
      userId: String(doc.userId),
      title: doc.title,
      documentIds: doc.documentIds,
      lastMessagePreview: doc.lastMessagePreview,
      messages: doc.messages.map((m) => {
        const messageId = this.extractId(m);
        return {
          id: messageId,
          role: m.role,
          content: m.content,
          status: m.status,
          sources: m.sources,
          tokensUsed: m.tokensUsed,
          createdAt: m.createdAt,
        };
      }),
      isArchived: doc.isArchived,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  private extractId(obj: unknown): string {
    if (obj && typeof obj === 'object' && '_id' in obj) {
      const id = (obj as { _id: unknown })._id;
      if (id instanceof Types.ObjectId) {
        return id.toHexString();
      }
      return String(id ?? '');
    }
    return '';
  }
}
