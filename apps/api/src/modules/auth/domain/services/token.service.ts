import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type {
  AuthenticatedUser,
  AuthTokenClaims,
  IdentityProvider,
} from '@repo/types';
import type { JWTPayload } from '../types/esm-bridge.types';
import { randomUUID } from 'crypto';
import { env } from '../../../../shared/utils/env';

interface IssueSessionInput {
  user: AuthenticatedUser;
  sessionId?: string;
}

export interface IssuedSessionTokens {
  sessionId: string;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TokenService {
  private readonly accessSecret = new TextEncoder().encode(env.JWT_SECRET);
  private readonly refreshSecret = new TextEncoder().encode(
    env.REFRESH_TOKEN_SECRET,
  );

  async issueSession(input: IssueSessionInput): Promise<IssuedSessionTokens> {
    const sessionId = input.sessionId ?? randomUUID();
    const claims: Omit<AuthTokenClaims, 'typ'> = {
      sub: input.user.userId,
      sid: sessionId,
      authId: input.user.authId,
      email: input.user.email,
      name: input.user.name,
      avatarUrl: input.user.avatarUrl,
      provider: input.user.provider,
      role: input.user.role,
    };

    const accessToken = await this.signToken(
      { ...claims, typ: 'access' },
      this.accessSecret,
      env.JWT_EXPIRES_IN,
    );
    const refreshToken = await this.signToken(
      { ...claims, typ: 'refresh' },
      this.refreshSecret,
      env.REFRESH_TOKEN_EXPIRES_IN,
    );

    return { sessionId, accessToken, refreshToken };
  }

  verifyAccessToken(token: string): Promise<AuthenticatedUser> {
    return this.verifyToken(token, this.accessSecret, 'access');
  }

  verifyRefreshToken(token: string): Promise<AuthenticatedUser> {
    return this.verifyToken(token, this.refreshSecret, 'refresh');
  }

  getRefreshExpiryDate(now = new Date()): Date {
    const duration = this.parseDurationMs(env.REFRESH_TOKEN_EXPIRES_IN);
    return new Date(now.getTime() + duration);
  }

  private async signToken(
    claims: AuthTokenClaims,
    secret: Uint8Array,
    expiresIn: string,
  ): Promise<string> {
    const { SignJWT } = await import('jose');
    const jwtPayload: JWTPayload = { ...claims };
    return new SignJWT(jwtPayload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(claims.sub)
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(secret);
  }

  private async verifyToken(
    token: string,
    secret: Uint8Array,
    expectedType: AuthTokenClaims['typ'],
  ): Promise<AuthenticatedUser> {
    try {
      const { jwtVerify } = await import('jose');
      const { payload } = await jwtVerify(token, secret);
      const claims = payload;

      if (claims.typ !== expectedType || typeof claims.sub !== 'string') {
        throw new UnauthorizedException('Invalid token');
      }

      return {
        userId: claims.sub,
        sessionId: typeof claims.sid === 'string' ? claims.sid : undefined,
        authId: typeof claims.authId === 'string' ? claims.authId : undefined,
        email: typeof claims.email === 'string' ? claims.email : undefined,
        name: typeof claims.name === 'string' ? claims.name : undefined,
        avatarUrl:
          typeof claims.avatarUrl === 'string' ? claims.avatarUrl : undefined,
        provider: this.isIdentityProvider(claims.provider)
          ? claims.provider
          : undefined,
        role: typeof claims.role === 'string' ? claims.role : undefined,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private parseDurationMs(input: string): number {
    const match = /^(\d+)(ms|s|m|h|d)$/.exec(input);
    if (!match) {
      throw new BadRequestException(`Unsupported duration format: ${input}`);
    }

    const amount = Number(match[1]);
    const unit = match[2];
    switch (unit) {
      case 'ms':
        return amount;
      case 's':
        return amount * 1000;
      case 'm':
        return amount * 60 * 1000;
      case 'h':
        return amount * 60 * 60 * 1000;
      case 'd':
        return amount * 24 * 60 * 60 * 1000;
      default:
        throw new BadRequestException(
          `Unsupported duration unit: ${String(unit)}`,
        );
    }
  }

  private isIdentityProvider(value: unknown): value is IdentityProvider {
    return value === 'google' || value === 'github' || value === 'dev';
  }
}
