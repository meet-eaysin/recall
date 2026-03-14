import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Receiver } from '@upstash/qstash';
import { env } from '../utils/env';

@Injectable()
export class QStashGuard implements CanActivate {
  private receiver: Receiver;
  private readonly logger = new Logger(QStashGuard.name);

  constructor() {
    this.receiver = new Receiver({
      currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
      nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // In local development, we might not have QStash signatures if we are testing locally without local tunnel
    if (env.NODE_ENV === 'development') {
      if (
        !env.QSTASH_CURRENT_SIGNING_KEY ||
        request.headers['x-dev-bypass'] === 'true'
      ) {
        this.logger.warn(
          'Skipping QStash signature verification in development mode',
        );
        return true;
      }
    }

    const signature =
      request.headers['upstash-signature'] ||
      request.headers['Upstash-Signature'];

    if (!signature) {
      this.logger.error('Missing Upstash-Signature header');
      throw new UnauthorizedException('Missing Upstash-Signature header');
    }

    try {
      const rawBody = request.rawBody?.toString('utf-8') || '';
      const isValid = await this.receiver.verify({
        signature: Array.isArray(signature) ? signature[0] : signature,
        body: rawBody,
      });
      return isValid;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Webhook signature verification failed: ${errorMessage}`,
      );
      throw new UnauthorizedException('Invalid Webhook Signature');
    }
  }
}
