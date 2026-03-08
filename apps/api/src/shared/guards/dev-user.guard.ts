import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticatedUser } from '@repo/types';

@Injectable()
export class DevUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (request.user) {
      return true;
    }
    let userId = request.headers['x-user-id'];

    if (!userId || typeof userId !== 'string') {
      throw new UnauthorizedException('Missing x-user-id header');
    }

    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      const hex = Buffer.from(userId).toString('hex');
      userId = hex.padEnd(24, '0').slice(0, 24);
    }

    request.user = {
      userId,
      authId: `dev:${userId}`,
      provider: 'dev',
      sessionId: 'dev-session',
    } satisfies AuthenticatedUser;
    return true;
  }
}
