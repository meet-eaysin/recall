import { Module, Global } from '@nestjs/common';
import { EnqueueEmailUseCase } from './application/use-cases/enqueue-email.usecase';
import { IEmailQueueDispatcher } from './domain/repositories/email-queue-dispatcher.repository';
import { QueueEmailQueueDispatcher } from './infrastructure/queue/queue-email-queue.dispatcher';
import { QueueModule as SharedQueueModule } from '@repo/queue';
import { env } from '../../shared/utils/env';

@Global()
@Module({
  imports: [
    SharedQueueModule.forRoot({
      provider: env.QUEUE_PROVIDER,
      qstash: {
        token: env.QSTASH_TOKEN,
        baseUrl: env.QSTASH_URL,
        workerUrl: env.WORKER_URL,
        devBypass: env.NODE_ENV === 'development',
      },

      http: {
        baseUrl: env.WORKER_URL,
        devBypassHeader: true,
      },
    }),
  ],
  providers: [
    EnqueueEmailUseCase,
    {
      provide: IEmailQueueDispatcher,
      useClass: QueueEmailQueueDispatcher,
    },
  ],
  exports: [EnqueueEmailUseCase, IEmailQueueDispatcher, SharedQueueModule],
})
export class QueueModule {}
