import { Injectable } from '@nestjs/common';
import type { UserSessionView } from '@repo/types';
import { IRefreshSessionRepository } from '../../../auth/domain/repositories/refresh-session.repository';

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
