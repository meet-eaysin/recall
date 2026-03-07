import { Injectable } from '@nestjs/common';
import { IRefreshSessionRepository } from '../../../auth/domain/repositories/refresh-session.repository';

export interface UserSessionView {
  sessionId: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: string;
  current: boolean;
}

@Injectable()
export class ListUserSessionsUseCase {
  constructor(
    private readonly refreshSessionRepository: IRefreshSessionRepository,
  ) {}

  async execute(
    userId: string,
    currentSessionId?: string,
  ): Promise<UserSessionView[]> {
    const sessions =
      await this.refreshSessionRepository.findActiveByUserId(userId);

    return sessions.map((session) => ({
      sessionId: session.sessionId,
      userAgent: session.props.userAgent ?? null,
      ipAddress: session.props.ipAddress ?? null,
      expiresAt: session.expiresAt.toISOString(),
      current: session.sessionId === currentSessionId,
    }));
  }
}
