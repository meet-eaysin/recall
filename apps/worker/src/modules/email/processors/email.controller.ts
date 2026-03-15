import {
  Logger,
  Controller,
  Post,
  UseGuards,
  Body,
  Headers,
} from '@nestjs/common';
import { QUEUE_EMAILS } from '@repo/types';
import type { EmailJobData } from '@repo/types';
import { QueueWebhookGuard } from '../../../shared/guards/queue-webhook.guard';
import { EmailService } from '../email.service';

@Controller('api/webhooks')
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailService: EmailService) {}

  @Post(QUEUE_EMAILS)
  @UseGuards(QueueWebhookGuard)
  async process(
    @Body() data: EmailJobData,
    @Headers('Upstash-Message-Id') messageId: string,
  ): Promise<void> {
    const { to, subject } = data;
    const jobId = messageId ?? 'unknown';
    this.logger.log(`Processing email job ${jobId} for recipient ${to}`);

    await this.emailService.send(data);

    this.logger.log(`Email job ${jobId} sent with subject "${subject}"`);
  }
}
