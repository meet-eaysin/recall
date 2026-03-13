export enum NotionSyncDirectionType {
  TO_NOTION = 'to_notion',
  FROM_Notion = 'from_notion',
  BOTH = 'both',
}

export interface NotionConfigPublicView {
  userId: string;
  workspaceId: string;
  workspaceName?: string | undefined;
  targetDatabaseId?: string | undefined;
  syncEnabled: boolean;
  syncDirection: NotionSyncDirectionType;
  lastSyncedAt?: string | undefined;
}

export interface NotionDatabase {
  id: string;
  title: string;
}

export interface ConnectNotionRequest {
  accessToken: string;
}

export interface UpdateNotionConfigRequest {
  targetDatabaseId?: string;
  syncEnabled?: boolean;
  syncDirection?: NotionSyncDirectionType;
}

export interface NotionSyncResult {
  synced: number;
  failed: number;
  errors: string[];
}

export interface NotionConfigProps {
  id?: string;
  userId: string;
  accessToken: string;
  workspaceId: string;
  workspaceName?: string;
  targetDatabaseId?: string;
  syncEnabled: boolean;
  syncDirection: NotionSyncDirectionType;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
