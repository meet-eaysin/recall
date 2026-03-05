import { TEST_USER_ID } from './common';

export interface NotionConfigResponse {
  success: boolean;
  data: {
    userId: string;
    workspaceId: string;
    workspaceName: string;
    targetDatabaseId?: string;
    syncEnabled: boolean;
    syncDirection: 'to_notion' | 'from_notion' | 'both';
    lastSyncedAt?: string;
  };
}

export function isNotionConfigResponse(body: unknown): body is NotionConfigResponse {
  if (typeof body !== 'object' || body === null) return false;
  if (!('success' in body) || body.success !== true) return false;
  if (!('data' in body) || typeof body.data !== 'object' || body.data === null) return false;
  const data = body.data;
  return 'workspaceId' in data && typeof data.workspaceId === 'string';
}

export async function seedNotionConfig(userId: string = TEST_USER_ID): Promise<void> {
  const { NotionConfigModel } = await import('@repo/db');
  const config = new NotionConfigModel({
    userId,
    accessToken: 'mock-token',
    workspaceId: 'mock-workspace',
    workspaceName: 'Mock Workspace',
    syncEnabled: true,
    syncDirection: 'to_notion',
  });
  await config.save();
}
