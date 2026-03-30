import {
  Controller,
  Post,
  UseGuards,
  Body,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { QueueWebhookGuard } from '../../../shared/guards/queue-webhook.guard';
import { QUEUE_NOTION_SYNC } from '@repo/types';
import type { NotionSyncJobData } from '@repo/types';
import { InternalApiClientService } from '../../../shared/services/internal-api-client.service';

@Controller('api/webhooks')
export class NotionController {
  constructor(private readonly internalApiClient: InternalApiClientService) {}

  @Post(QUEUE_NOTION_SYNC)
  @UseGuards(QueueWebhookGuard)
  async process(@Body() data: NotionSyncJobData): Promise<void> {
    try {
      await this.processJob(data);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException('Notion sync job failed');
    }
  }

  private async processJob(data: NotionSyncJobData): Promise<void> {
    await this.internalApiClient.post('/jobs/notion-sync', data);
  }
}
