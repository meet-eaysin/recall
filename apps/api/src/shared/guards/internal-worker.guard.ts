import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { env } from '../utils/env';

@Injectable()
export class InternalWorkerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers?: Record<string, string | string[] | undefined>;
    }>();

    const rawSecret = request.headers?.['x-internal-secret'];
    const providedSecret = Array.isArray(rawSecret) ? rawSecret[0] : rawSecret;

    if (!providedSecret || providedSecret !== env.INTERNAL_API_SECRET) {
      throw new UnauthorizedException('Invalid internal worker secret');
    }

    return true;
  }
}
