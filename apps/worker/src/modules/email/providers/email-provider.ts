import type { EmailJobData } from '@repo/types';

export interface EmailProvider {
  send(data: EmailJobData): Promise<void>;
}

export const EMAIL_PROVIDER_TOKEN = Symbol('EMAIL_PROVIDER_TOKEN');
