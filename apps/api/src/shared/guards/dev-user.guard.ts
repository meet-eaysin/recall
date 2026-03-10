import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '@repo/types';
import { EnsureDevUserUseCase } from '../../modules/users/application/use-cases/ensure-dev-user.usecase';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class DevUserGuard implements CanActivate {
  constructor(
    private readonly ensureDevUserUseCase: EnsureDevUserUseCase,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    if (request.user) {
      return true;
    }
    let userId = request.headers['x-user-id'];

    if (!userId || typeof userId !== 'string') {
      if (isPublic) return true;
      throw new UnauthorizedException('Missing x-user-id header');
    }

    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      const hex = Buffer.from(userId).toString('hex');
      userId = hex.padEnd(24, '0').slice(0, 24);
    }

    const authId = `dev:${userId}`;
    await this.ensureDevUserUseCase.execute({
      id: userId,
      authId,
      email: `dev-${userId}@local.dev`,
      name: 'Development User',
    });

    request.user = {
      userId,
      authId,
      provider: 'dev',
      sessionId: 'dev-session',
    } satisfies AuthenticatedUser;
    return true;
  }
}
