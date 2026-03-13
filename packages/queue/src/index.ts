import { Injectable, OnModuleInit, Global, Module } from '@nestjs/common';
import { Client } from '@upstash/qstash';

export interface QStashConfigOptions {
  token: string;
}

let qstashClient: Client | null = null;

export function initializeQStash(options: QStashConfigOptions): Client {
  if (!qstashClient) {
    qstashClient = new Client({ token: options.token });
  }
  return qstashClient;
}

export function getQStashClient(): Client {
  if (!qstashClient) {
    throw new Error('QStash client has not been initialized. Call initializeQStash first.');
  }
  return qstashClient;
}

@Injectable()
export class QStashService implements OnModuleInit {
  onModuleInit() {
    const token = process.env.QSTASH_TOKEN;
    if (token) {
      initializeQStash({ token });
    }
  }

  async publishMessage<T>(queueName: string, payload: T): Promise<string> {
    const client = getQStashClient();
    const workerUrl = process.env.WORKER_URL || 'http://localhost:3002';
    const result = await client.publishJSON({
      url: `${workerUrl}/api/webhooks/${queueName}`,
      body: payload,
    });
    return result.messageId;
  }
}

@Global()
@Module({
  providers: [QStashService],
  exports: [QStashService],
})
export class QStashModule {}