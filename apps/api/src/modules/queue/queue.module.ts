import { createBullQueueConfig, BullModule } from '@repo/queue';
import { Module, Global } from '@nestjs/common';
import {
  DEFAULT_QUEUE_JOB_OPTIONS,
  QUEUE_EMAILS,
  QUEUE_INGESTION,
  QUEUE_SUMMARY,
  QUEUE_TRANSCRIPT,
  QUEUE_GRAPH,
  QUEUE_NOTION_SYNC,
} from '@repo/types';
import { EnqueueEmailUseCase } from './application/use-cases/enqueue-email.usecase';
import { IEmailQueueDispatcher } from './domain/repositories/email-queue-dispatcher.repository';
import { env } from '../../shared/utils/env';
import { BullEmailQueueDispatcher } from './infrastructure/bullmq/bull-email-queue.dispatcher';

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      ...createBullQueueConfig({
        redis: {
          host: env.REDIS_HOST,
          port: env.REDIS_PORT,
          password: env.REDIS_PASSWORD,
        },
      }),
      prefix: 'mindstack',
      defaultJobOptions: DEFAULT_QUEUE_JOB_OPTIONS,
    }),
    BullModule.registerQueue(
      { name: QUEUE_EMAILS },
      { name: QUEUE_INGESTION },
      { name: QUEUE_SUMMARY },
      { name: QUEUE_TRANSCRIPT },
      { name: QUEUE_GRAPH },
      { name: QUEUE_NOTION_SYNC },
    ),
  ],
  providers: [
    EnqueueEmailUseCase,
    {
      provide: IEmailQueueDispatcher,
      useClass: BullEmailQueueDispatcher,
    },
  ],
  exports: [EnqueueEmailUseCase, IEmailQueueDispatcher, BullModule],
})
export class QueueModule {}
