import type {
  NotionSyncDirectionType,
  NotionConfigPublicView,
} from '@repo/types';

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

export class NotionConfigEntity {
  constructor(public readonly props: NotionConfigProps) {}

  get id(): string | undefined {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get accessToken(): string {
    return this.props.accessToken;
  }

  toPublicView(): NotionConfigPublicView {
    return {
      userId: this.props.userId,
      workspaceId: this.props.workspaceId,
      workspaceName: this.props.workspaceName,
      targetDatabaseId: this.props.targetDatabaseId,
      syncEnabled: this.props.syncEnabled,
      syncDirection: this.props.syncDirection,
      lastSyncedAt: this.props.lastSyncedAt?.toISOString(),
    };
  }
}
