import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../../../shared/decorators/public.decorator';
import { env } from '../../../../shared/utils/env';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    // Dev auth bypass
    if (env.DEV_AUTH_ENABLED && request.headers['x-user-id']) {
      request.user = { userId: request.headers['x-user-id'] };
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser | null,
    _info: unknown,
    context: ExecutionContext,
    _status?: unknown,
  ): TUser {
    if (err || !user) {
      const isPublic = this.reflector.getAllAndOverride<boolean>(
        IS_PUBLIC_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (isPublic) {
        return null as unknown as TUser;
      }

      throw err || new UnauthorizedException('Authentication required');
    }

    return user;
  }
}
