import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { EmailJobData } from '@repo/types';
import { env } from '../../../shared/utils/env';
import type { EmailProvider } from './email-provider';

interface ResendConfig {
  apiKey: string;
  from: string;
}

@Injectable()
export class ResendEmailProvider implements EmailProvider {
  private readonly logger = new Logger(ResendEmailProvider.name);

  async send(data: EmailJobData): Promise<void> {
    const config = this.getConfig();
    const payload = {
      from: config.from,
      to: [data.to],
      subject: data.subject,
      html: data.body,
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(
        `Resend request failed status=${response.status} body=${errorBody}`,
      );
      throw new InternalServerErrorException('Email provider request failed');
    }

    this.logger.debug(`Email sent to ${data.to}`);
  }

  private getConfig(): ResendConfig {
    const apiKey = env.RESEND_API_KEY;
    const from = env.EMAIL_FROM;

    if (!apiKey || !from) {
      throw new InternalServerErrorException(
        'Email provider configuration is missing',
      );
    }

    return { apiKey, from };
  }
}
