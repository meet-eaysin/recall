import { RefreshSessionEntity } from '../entities/refresh-session.entity';

export interface CreateRefreshSessionInput {
  sessionId: string;
  userId: string;
  tokenHash: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
}

export abstract class IRefreshSessionRepository {
  abstract create(
    input: CreateRefreshSessionInput,
  ): Promise<RefreshSessionEntity>;
  abstract findActiveBySessionId(
    sessionId: string,
  ): Promise<RefreshSessionEntity | null>;
  abstract findActiveByUserId(userId: string): Promise<RefreshSessionEntity[]>;
  abstract revoke(sessionId: string): Promise<void>;
  abstract revokeAllForUser(userId: string): Promise<void>;
}
