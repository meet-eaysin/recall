import type { QueueOptions, JobsOptions, Job } from 'bullmq';
import { Queue } from 'bullmq';
import type { Redis } from 'ioredis';
import type { NotionAction } from '@repo/types';
import type {
  IngestionJobData,
  SummaryJobData,
  GraphJobData,
  NotionSyncJobData,
  TranscriptJobData,
} from './job-types';

export class BaseQueue<T extends object> {
  protected queue: Queue<T>;

  constructor(
    name: string,
    connection: Redis,
    options: Partial<QueueOptions> = {},
  ) {
    this.queue = new Queue<T>(name, {
      connection,
      prefix: 'mindstack',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: 1000,
      },
      ...options,
    });
  }

  async add(name: string, data: T, opts?: JobsOptions) {
    return this.queue.add(name, data, opts);
  }

  async close() {
    await this.queue.close();
  }
}

export class IngestionQueue extends BaseQueue<IngestionJobData> {
  constructor(connection: Redis) {
    super('ingestion', connection);
  }

  async addJob(
    documentId: string,
    userId: string,
  ): Promise<Job<IngestionJobData>> {
    return this.queue.add('process', {
      documentId,
      userId,
      type: 'unknown',
      source: '',
    });
  }
}

export class SummaryQueue extends BaseQueue<SummaryJobData> {
  constructor(connection: Redis) {
    super('summary', connection);
  }

  async addJob(documentId: string, userId: string) {
    return this.queue.add('summary', { documentId, userId });
  }
}

export class TranscriptQueue extends BaseQueue<TranscriptJobData> {
  constructor(connection: Redis) {
    super('transcript', connection);
  }

  async addJob(documentId: string, userId: string) {
    return this.queue.add('transcript', { documentId, userId });
  }
}

export class GraphQueue extends BaseQueue<GraphJobData> {
  constructor(connection: Redis) {
    super('graph', connection);
  }

  async addJob(documentId: string, userId: string) {
    return this.queue.add('graph', { documentId, userId });
  }
}

export class NotionSyncQueue extends BaseQueue<NotionSyncJobData> {
  constructor(connection: Redis) {
    super('notion-sync', connection);
  }

  async addJob(documentId: string, userId: string, action: NotionAction) {
    return this.queue.add('sync', { documentId, userId, action });
  }
}

// Singletons that will be initialized
export let ingestionQueue: IngestionQueue;
export let summaryQueue: SummaryQueue;
export let graphQueue: GraphQueue;
export let notionQueue: NotionSyncQueue;
export let transcriptQueue: TranscriptQueue;

export function initQueues(connection: Redis) {
  if (
    ingestionQueue &&
    summaryQueue &&
    graphQueue &&
    notionQueue &&
    transcriptQueue
  ) {
    return {
      ingestionQueue,
      summaryQueue,
      graphQueue,
      notionQueue,
      transcriptQueue,
    };
  }

  ingestionQueue = new IngestionQueue(connection);
  summaryQueue = new SummaryQueue(connection);
  graphQueue = new GraphQueue(connection);
  notionQueue = new NotionSyncQueue(connection);
  transcriptQueue = new TranscriptQueue(connection);

  return {
    ingestionQueue,
    summaryQueue,
    graphQueue,
    notionQueue,
    transcriptQueue,
  };
}
