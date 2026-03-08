import type { LLMConfigPublicView } from '@repo/types';

export interface LLMConfigProps {
  id?: string;
  userId: string;
  provider: 'openai' | 'anthropic' | 'ollama';
  chatModel: string;
  embeddingModel: string;
  apiKey: string | null;
  baseUrl: string | null;
  capabilities: {
    chat: boolean;
    embeddings: boolean;
  };
  validatedAt: Date | undefined;
}

export class LLMConfigEntity {
  constructor(public readonly props: LLMConfigProps) {}

  get id(): string | undefined {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  toPublicView(): LLMConfigPublicView {
    return {
      userId: this.props.userId,
      provider: this.props.provider,
      chatModel: this.props.chatModel,
      embeddingModel: this.props.embeddingModel,
      baseUrl: this.props.baseUrl,
      capabilities: this.props.capabilities,
      validatedAt: this.props.validatedAt?.toISOString() ?? null,
    };
  }
}
