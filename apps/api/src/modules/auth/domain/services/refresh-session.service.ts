import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { AuthenticatedUser } from '@repo/types';
import { IRefreshSessionRepository } from '../repositories/refresh-session.repository';
import { TokenService } from './token.service';

interface PersistSessionInput {
  user: AuthenticatedUser;
  tokens: {
    sessionId: string;
    accessToken: string;
    refreshToken: string;
  };
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class RefreshSessionService {
  constructor(
    private readonly refreshSessionRepository: IRefreshSessionRepository,
    private readonly tokenService: TokenService,
  ) {}

  async createSession(input: PersistSessionInput): Promise<void> {
    await this.refreshSessionRepository.create({
      sessionId: input.tokens.sessionId,
      userId: input.user.userId,
      tokenHash: this.hashToken(input.tokens.refreshToken),
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
      expiresAt: this.tokenService.getRefreshExpiryDate(),
    });
  }

  async rotateSession(refreshToken: string): Promise<{
    user: AuthenticatedUser;
    tokens: {
      sessionId: string;
      accessToken: string;
      refreshToken: string;
    };
  }> {
    const user = await this.tokenService.verifyRefreshToken(refreshToken);
    const sessionId = user.sessionId;

    if (!sessionId) {
      throw new UnauthorizedException('Invalid refresh session');
    }

    const session =
      await this.refreshSessionRepository.findActiveBySessionId(sessionId);
    if (!session || session.tokenHash !== this.hashToken(refreshToken)) {
      throw new UnauthorizedException('Refresh session not found');
    }

    await this.refreshSessionRepository.revoke(sessionId);

    const tokens = await this.tokenService.issueSession({ user });
    await this.refreshSessionRepository.create({
      sessionId: tokens.sessionId,
      userId: user.userId,
      tokenHash: this.hashToken(tokens.refreshToken),
      expiresAt: this.tokenService.getRefreshExpiryDate(),
    });

    return { user, tokens };
  }

  async revokeCurrentSession(user: AuthenticatedUser): Promise<void> {
    if (user.sessionId) {
      await this.refreshSessionRepository.revoke(user.sessionId);
    }
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await this.refreshSessionRepository.revokeAllForUser(userId);
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
