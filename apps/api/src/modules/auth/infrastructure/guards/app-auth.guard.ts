import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../../../../shared/decorators/public.decorator';
import { AuthenticatedUser } from '../../../../shared/types/authenticated-user.type';
import { AuthCookieService } from '../cookies/auth-cookie.service';
import { TokenService } from '../../domain/services/token.service';
import { IRefreshSessionRepository } from '../../domain/repositories/refresh-session.repository';

@Injectable()
export class AppAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authCookieService: AuthCookieService,
    private readonly tokenService: TokenService,
    private readonly refreshSessionRepository: IRefreshSessionRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();

    const user = await this.authenticate(request);
    if (user) {
      request.user = user;
      return true;
    }

    if (isPublic) return true;

    throw new UnauthorizedException('Authentication required');
  }

  private async authenticate(
    request: Request,
  ): Promise<AuthenticatedUser | null> {
    const bearerToken = this.getBearerToken(request);
    if (bearerToken) {
      const user = await this.tokenService.verifyAccessToken(bearerToken);
      return this.ensureActiveSession(user);
    }

    const cookieToken = this.authCookieService.getAccessToken(request);
    if (cookieToken) {
      const user = await this.tokenService.verifyAccessToken(cookieToken);
      return this.ensureActiveSession(user);
    }

    return null;
  }

  private getBearerToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return null;
    }

    const token = header.slice('Bearer '.length).trim();
    return token.length > 0 ? token : null;
  }

  private async ensureActiveSession(
    user: AuthenticatedUser,
  ): Promise<AuthenticatedUser> {
    if (!user.sessionId) {
      throw new UnauthorizedException('Invalid session');
    }

    const session = await this.refreshSessionRepository.findActiveBySessionId(
      user.sessionId,
    );

    if (!session) {
      throw new UnauthorizedException('Session is no longer active');
    }

    return user;
  }
}
