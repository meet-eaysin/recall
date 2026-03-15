import { InternalServerErrorException } from '@nestjs/common';
import { Client } from '@upstash/qstash';
import type { IQueueProvider } from '../interfaces/queue-provider.interface';
import { HttpQueueProvider } from './http-queue.provider';

export interface QStashQueueProviderOptions {
  token?: string;
  baseUrl?: string;
  workerUrl: string;
  devBypass?: boolean;
}

export class QStashQueueProvider implements IQueueProvider {
  private client: Client | null = null;
  private readonly httpFallback: HttpQueueProvider;

  constructor(private readonly options: QStashQueueProviderOptions) {
    this.httpFallback = new HttpQueueProvider({
      baseUrl: options.workerUrl,
      devBypassHeader: true,
    });
  }

  private getClient(): Client {
    if (!this.client) {
      if (!this.options.token) {
        throw new InternalServerErrorException(
          'QSTASH_TOKEN is required for QStash provider',
        );
      }
      this.client = new Client({
        token: this.options.token,
        baseUrl: this.options.baseUrl,
      });
    }
    return this.client;
  }

  private shouldBypassQStash(): boolean {
    const workerUrl = this.options.workerUrl;
    return (
      !!this.options.devBypass &&
      (!this.options.token ||
        workerUrl.includes('localhost') ||
        workerUrl.includes('127.0.0.1'))
    );
  }

  async publishMessage<T>(queueName: string, payload: T): Promise<string> {
    if (this.shouldBypassQStash()) {
      try {
        return await this.httpFallback.publishMessage(queueName, payload);
      } catch {
        return 'dev-dummy-id';
      }
    }

    const client = this.getClient();
    const result = await client.publishJSON({
      url: `${this.options.workerUrl}/api/webhooks/${queueName}`,
      body: payload,
    });
    return result.messageId;
  }
}
