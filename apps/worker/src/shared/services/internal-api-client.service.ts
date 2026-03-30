import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { env } from '../utils/env';

@Injectable()
export class InternalApiClientService {
  private readonly logger = new Logger(InternalApiClientService.name);

  async post(path: string, payload: unknown): Promise<void> {
    const response = await fetch(`${env.API_INTERNAL_URL}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-internal-secret': env.INTERNAL_API_SECRET,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return;
    }

    const body = await response.text();
    this.logger.error(
      `Internal API request failed (${response.status} ${response.statusText}): ${body}`,
    );
    throw new InternalServerErrorException('Internal API request failed');
  }
}
