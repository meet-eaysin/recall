import {
  Controller,
  Post,
  UseGuards,
  Body,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { QueueWebhookGuard } from '../../../shared/guards/queue-webhook.guard';
import { QUEUE_TRANSCRIPT } from '@repo/types';
import type { TranscriptJobData } from '@repo/types';
import { InternalApiClientService } from '../../../shared/services/internal-api-client.service';

@Controller('api/webhooks')
export class TranscriptController {
  constructor(private readonly internalApiClient: InternalApiClientService) {}

  @Post(QUEUE_TRANSCRIPT)
  @UseGuards(QueueWebhookGuard)
  async process(@Body() data: TranscriptJobData): Promise<void> {
    try {
      await this.processJob(data);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException('Transcript job failed');
    }
  }

  private async processJob(data: TranscriptJobData): Promise<void> {
    if (!data.documentId || !data.userId) {
      throw new BadRequestException('Invalid transcript job payload');
    }

    await this.internalApiClient.post('/jobs/transcript', data);
  }
}
