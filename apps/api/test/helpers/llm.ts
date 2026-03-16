import { TEST_USER_ID } from './common';
import type { LLMConfig } from '@repo/types';

export interface LLMConfigResponse {
  success: boolean;
  data: {
    registry: Array<{
      id: string;
      name: string;
    }>;
    configs: Array<Omit<LLMConfig, 'apiKey'> & { hasApiKey: boolean }>;
    activeConfigId?: string;
  };
}

export function isLLMConfigResponse(body: unknown): body is LLMConfigResponse {
  if (typeof body !== 'object' || body === null) return false;
  if (!('success' in body) || body.success !== true) return false;
  if (!('data' in body) || typeof body.data !== 'object' || body.data === null)
    return false;
  const data = body.data;
  return 'registry' in data && Array.isArray(data.registry);
}

export async function seedLLMConfig(
  userId: string = TEST_USER_ID,
): Promise<void> {
  const { UserModel } = await import('@repo/db');
  const authId = `dev:${userId}`;
  const configId = 'seeded-llm-config';
  await UserModel.findByIdAndUpdate(
    userId,
    {
      $set: {
        email: `dev-${userId}@test.local`,
        name: 'Test User',
        authId,
        llmUserSettings: {
          activeConfigId: configId,
          configs: [
            {
              id: configId,
              providerId: 'openai',
              modelId: 'gpt-4o-mini',
              useSystemDefault: true,
            },
          ],
        },
      },
    },
    { upsert: true },
  );
}
