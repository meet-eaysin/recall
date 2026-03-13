import type { QueueOptions, ConnectionOptions } from 'bullmq';
import { DEFAULT_QUEUE_JOB_OPTIONS } from '@repo/types';

export interface BullConfigOptions {
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  prefix?: string;
}

/**
 * Creates a BullMQ Queue configuration object.
 */
export function createBullQueueConfig(
  options: BullConfigOptions,
): QueueOptions {
  const connection: ConnectionOptions = {
    host: options.redis.host,
    port: options.redis.port,
    ...(options.redis.password ? { password: options.redis.password } : {}),
    family: 4,
    enableOfflineQueue: false,
    keepAlive: 10000,
  };

  return {
    connection,
    prefix: options.prefix || 'mindstack',
    defaultJobOptions: DEFAULT_QUEUE_JOB_OPTIONS,
  };
}

export {
  BullModule,
  InjectQueue,
  Processor,
  WorkerHost,
  OnWorkerEvent,
} from '@nestjs/bullmq';
export { Queue, Job, Worker } from 'bullmq';
export * from '@repo/types';
