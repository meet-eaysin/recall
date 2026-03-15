import { Inject, Injectable } from '@nestjs/common';
import type { EmailJobData } from '@repo/types';
import type { EmailProvider } from './providers/email-provider';
import { EMAIL_PROVIDER_TOKEN } from './providers/email-provider';

@Injectable()
export class EmailService {
  constructor(
    @Inject(EMAIL_PROVIDER_TOKEN)
    private readonly emailProvider: EmailProvider,
  ) {}

  async send(data: EmailJobData): Promise<void> {
    await this.emailProvider.send(data);
  }
}
