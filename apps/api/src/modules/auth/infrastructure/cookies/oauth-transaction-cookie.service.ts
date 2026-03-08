import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthProvider } from '@repo/types';
import { Response } from 'express';
import { JWTPayload, SignJWT, jwtVerify } from 'jose';
import { env } from '../../../../shared/utils/env';

const OAUTH_TRANSACTION_COOKIE = 'ms_oauth_txn';

interface OAuthTransactionPayload {
  provider: AuthProvider;
  state: string;
  codeVerifier: string;
  redirectUri: string;
}

@Injectable()
export class OAuthTransactionCookieService {
  private readonly secret = new TextEncoder().encode(env.ENCRYPTION_KEY);

  async setTransactionCookie(
    response: Response,
    payload: OAuthTransactionPayload,
  ): Promise<void> {
    const token = await new SignJWT(payload as unknown as JWTPayload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime('10m')
      .sign(this.secret);

    response.cookie(OAUTH_TRANSACTION_COOKIE, token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
    });
  }

  clearTransactionCookie(response: Response): void {
    response.clearCookie(OAUTH_TRANSACTION_COOKIE, { path: '/api/v1/auth' });
  }

  async readTransactionCookie(request: {
    cookies?: Record<string, unknown>;
  }): Promise<OAuthTransactionPayload> {
    const token = request.cookies?.[OAUTH_TRANSACTION_COOKIE];
    if (typeof token !== 'string') {
      throw new UnauthorizedException('Missing OAuth transaction cookie');
    }

    try {
      const { payload } = await jwtVerify(token, this.secret);

      if (
        (payload.provider !== 'google' && payload.provider !== 'github') ||
        typeof payload.state !== 'string' ||
        typeof payload.codeVerifier !== 'string' ||
        typeof payload.redirectUri !== 'string'
      ) {
        throw new UnauthorizedException('Invalid OAuth transaction');
      }

      return {
        provider: payload.provider,
        state: payload.state,
        codeVerifier: payload.codeVerifier,
        redirectUri: payload.redirectUri,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid or expired OAuth transaction');
    }
  }
}
