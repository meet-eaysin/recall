import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { env } from '../../../../shared/utils/env';

export const ACCESS_COOKIE_NAME = 'ms_access_token';
export const REFRESH_COOKIE_NAME = 'ms_refresh_token';

@Injectable()
export class AuthCookieService {
  setSessionCookies(
    response: Response,
    tokens: { accessToken: string; refreshToken: string },
  ): void {
    response.cookie(ACCESS_COOKIE_NAME, tokens.accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    response.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
    });
  }

  clearSessionCookies(response: Response): void {
    response.clearCookie(ACCESS_COOKIE_NAME, { path: '/' });
    response.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
  }

  getAccessToken(request: {
    cookies?: Record<string, unknown>;
  }): string | null {
    const token = request.cookies?.[ACCESS_COOKIE_NAME];
    return typeof token === 'string' ? token : null;
  }

  getRefreshToken(request: {
    cookies?: Record<string, unknown>;
  }): string | null {
    const token = request.cookies?.[REFRESH_COOKIE_NAME];
    return typeof token === 'string' ? token : null;
  }
}
