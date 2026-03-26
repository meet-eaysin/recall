import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { LegalService } from '../../modules/legal/application/legal.service';
import type { Request } from 'express';
import type { AuthenticatedUser } from '@repo/types';

@Injectable()
export class ConsentGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly legalService: LegalService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;

    // Legal routes are excluded via @Public() or explicit check
    const controller = context.getClass();
    if (
      controller.name === 'LegalController' ||
      controller.name === 'AuthController'
    ) {
      return true;
    }

    if (!user || !user.userId) {
      return true; // Let JwtAuthGuard handle unauthenticated users
    }

    const status = await this.legalService.getConsentStatus(user.userId);

    if (!status.privacyAccepted || !status.cookieAccepted) {
      const missing: string[] = [];
      if (!status.privacyAccepted) missing.push('privacy');
      if (!status.cookieAccepted) missing.push('cookie');

      throw new ForbiddenException({
        code: 'CONSENT_REQUIRED',
        missing,
        message:
          'You must accept the current privacy and cookie policies to continue.',
      });
    }

    return true;
  }
}
