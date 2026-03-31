import type { Model } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import type { IChatConversationDocument } from '../types/chat-conversation.type';

const chatSourceSchema = new Schema(
  {
    author: { type: String, default: null },
    documentId: { type: String, required: true },
    originalSource: { type: String, default: null },
    publishedAt: { type: String, default: null },
    title: { type: String, required: true },
  },
  { _id: false },
);

const chatMessageSchema = new Schema(
  {
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    sources: { type: [chatSourceSchema], default: [] },
    status: {
      type: String,
      enum: ['completed', 'error'],
      default: 'completed',
    },
    tokensUsed: { type: Number, default: 0 },
  },
  { _id: true },
);

const chatConversationSchema = new Schema<IChatConversationDocument>(
  {
    documentIds: { type: [String], default: [] },
    lastMessagePreview: { type: String, default: null },
    messages: { type: [chatMessageSchema], default: [] },
    title: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

chatConversationSchema.index({ userId: 1, updatedAt: -1 });

export const ChatConversationModel: Model<IChatConversationDocument> =
  mongoose.models['ChatConversation'] ||
  mongoose.model<IChatConversationDocument>(
    'ChatConversation',
    chatConversationSchema,
  );
