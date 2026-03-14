import {
  Logger,
  Controller,
  Post,
  UseGuards,
  Body,
  Headers,
} from '@nestjs/common';
import { QStashGuard } from '../../../shared/guards/qstash.guard';
import { GraphJobData, QUEUE_GRAPH } from '@repo/types';
import { GraphBuilderService } from '../graph-builder.service';

@Controller('api/webhooks')
export class GraphController {
  private readonly logger = new Logger(GraphController.name);

  constructor(private readonly graphBuilder: GraphBuilderService) {}

  @Post(QUEUE_GRAPH)
  @UseGuards(QStashGuard)
  async process(
    @Body() data: GraphJobData,
    @Headers('Upstash-Message-Id') messageId: string,
  ): Promise<void> {
    try {
      await this.processJob(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `[GraphController] Job ${messageId} failed: ${errorMessage}`,
      );
      throw err;
    }
  }

  private async processJob(data: GraphJobData): Promise<void> {
    const { documentId, userId } = data;
    if (typeof documentId !== 'string' || typeof userId !== 'string') {
      throw new Error('Invalid job data: documentId or userId is missing');
    }

    this.logger.log(
      `[GraphWorker] Processing relationships for document: ${documentId}`,
    );

    await this.graphBuilder.buildRelationships(documentId, userId);
  }
}
