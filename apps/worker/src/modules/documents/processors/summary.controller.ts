import {
  Controller,
  Post,
  UseGuards,
  Body,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { QueueWebhookGuard } from '../../../shared/guards/queue-webhook.guard';
import { QUEUE_SUMMARY } from '@repo/types';
import type { SummaryJobData } from '@repo/types';
import { InternalApiClientService } from '../../../shared/services/internal-api-client.service';

@Controller('api/webhooks')
export class SummaryController {
  constructor(private readonly internalApiClient: InternalApiClientService) {}

  @Post(QUEUE_SUMMARY)
  @UseGuards(QueueWebhookGuard)
  async process(@Body() data: SummaryJobData): Promise<void> {
    try {
      await this.processJob(data);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException('Summary job failed');
    }
  }

  private async processJob(data: SummaryJobData): Promise<void> {
    await this.internalApiClient.post('/jobs/summary', data);
  }
}
