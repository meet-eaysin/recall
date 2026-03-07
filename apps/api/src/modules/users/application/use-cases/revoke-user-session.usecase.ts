import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IRefreshSessionRepository } from '../../../auth/domain/repositories/refresh-session.repository';

@Injectable()
export class RevokeUserSessionUseCase {
  constructor(
    private readonly refreshSessionRepository: IRefreshSessionRepository,
  ) {}

  async execute(
    userId: string,
    sessionId: string,
    currentSessionId?: string,
  ): Promise<void> {
    const sessions =
      await this.refreshSessionRepository.findActiveByUserId(userId);
    const target = sessions.find((session) => session.sessionId === sessionId);

    if (!target) {
      throw new NotFoundException('Session not found');
    }

    if (currentSessionId && sessionId === currentSessionId) {
      throw new ForbiddenException('Use logout to revoke the current session');
    }

    await this.refreshSessionRepository.revoke(sessionId);
  }
}
