import {
  Logger,
  Controller,
  Post,
  UseGuards,
  Body,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { QueueWebhookGuard } from '../../../shared/guards/queue-webhook.guard';
import { QUEUE_GRAPH } from '@repo/types';
import type { GraphJobData } from '@repo/types';
import { InternalApiClientService } from '../../../shared/services/internal-api-client.service';

@Controller('api/webhooks')
export class GraphController {
  private readonly logger = new Logger(GraphController.name);

  constructor(private readonly internalApiClient: InternalApiClientService) {}

  @Post(QUEUE_GRAPH)
  @UseGuards(QueueWebhookGuard)
  async process(@Body() data: GraphJobData): Promise<void> {
    try {
      await this.processJob(data);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException('Graph job failed');
    }
  }

  private async processJob(data: GraphJobData): Promise<void> {
    const { documentId, userId } = data;
    if (typeof documentId !== 'string' || typeof userId !== 'string') {
      throw new BadRequestException(
        'Invalid job data: documentId or userId is missing',
      );
    }

    this.logger.log(
      `[GraphWorker] Processing relationships for document: ${documentId}`,
    );

    await this.internalApiClient.post('/jobs/graph', data);
  }
}
