import {
  Body,
  Controller,
  HttpException,
  InternalServerErrorException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { QUEUE_INGESTION } from '@repo/types';
import type { IngestionJobData } from '@repo/types';
import { QueueWebhookGuard } from '../../../shared/guards/queue-webhook.guard';
import { InternalApiClientService } from '../../../shared/services/internal-api-client.service';

@Controller('api/webhooks')
export class IngestionController {
  constructor(private readonly internalApiClient: InternalApiClientService) {}

  @Post(QUEUE_INGESTION)
  @UseGuards(QueueWebhookGuard)
  async process(@Body() data: IngestionJobData): Promise<void> {
    try {
      await this.internalApiClient.post('/jobs/ingestion', data);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException('Ingestion job failed');
    }
  }
}
