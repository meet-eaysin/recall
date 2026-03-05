import { TEST_USER_ID } from './common';

export interface LLMConfigResponse {
  success: boolean;
  data: {
    userId: string;
    provider: string;
    chatModel: string;
    embeddingModel: string;
    apiKey?: string;
    baseUrl?: string;
    organization?: string;
    capabilities: Record<string, unknown>;
    validatedAt: string;
  };
}

export function isLLMConfigResponse(body: unknown): body is LLMConfigResponse {
  if (typeof body !== 'object' || body === null) return false;
  if (!('success' in body) || body.success !== true) return false;
  if (!('data' in body) || typeof body.data !== 'object' || body.data === null) return false;
  const data = body.data;
  return (
    'provider' in data && typeof data.provider === 'string' && 
    'chatModel' in data && typeof data.chatModel === 'string' &&
    'embeddingModel' in data && typeof data.embeddingModel === 'string'
  );
}

export async function seedLLMConfig(userId: string = TEST_USER_ID): Promise<void> {
  const { LLMConfigModel } = await import('@repo/db');
  const config = new LLMConfigModel({
    userId,
    provider: 'openai',
    chatModel: 'gpt-4',
    embeddingModel: 'text-embedding-3-small',
    apiKey: 'mock-api-key',
    capabilities: { chat: true, embeddings: true },
    validatedAt: new Date(),
  });
  await config.save();
}
