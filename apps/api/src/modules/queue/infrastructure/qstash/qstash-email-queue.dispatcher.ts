import { Injectable } from '@nestjs/common';
import { EmailJobData, QUEUE_EMAILS } from '@repo/types';
import { IEmailQueueDispatcher } from '../../domain/repositories/email-queue-dispatcher.repository';
import { QStashService } from '@repo/queue';

@Injectable()
export class QStashEmailQueueDispatcher implements IEmailQueueDispatcher {
  constructor(private readonly qstashService: QStashService) {}

  async enqueue(data: EmailJobData): Promise<void> {
    await this.qstashService.publishMessage(QUEUE_EMAILS, data);
  }
}
