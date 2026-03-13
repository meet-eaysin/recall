import { Module, Global } from '@nestjs/common';
import { EnqueueEmailUseCase } from './application/use-cases/enqueue-email.usecase';
import { IEmailQueueDispatcher } from './domain/repositories/email-queue-dispatcher.repository';
import { QStashEmailQueueDispatcher } from './infrastructure/qstash/qstash-email-queue.dispatcher';
import { QStashModule } from '@repo/queue';

@Global()
@Module({
  imports: [QStashModule],
  providers: [
    EnqueueEmailUseCase,
    {
      provide: IEmailQueueDispatcher,
      useClass: QStashEmailQueueDispatcher,
    },
  ],
  exports: [EnqueueEmailUseCase, IEmailQueueDispatcher, QStashModule],
})
export class QueueModule {}
