import { Processor, WorkerHost, Job } from '@repo/queue';
import { Injectable, Logger } from '@nestjs/common';
import { GraphJobData, QUEUE_GRAPH } from '@repo/types';
import { GraphBuilderService } from '../graph-builder.service';

@Processor(QUEUE_GRAPH)
@Injectable()
export class GraphWorker extends WorkerHost {
  private readonly logger = new Logger(GraphWorker.name);

  constructor(private readonly graphBuilder: GraphBuilderService) {
    super();
  }

  async process(job: Job<GraphJobData>): Promise<void> {
    await this.processJob(job);
  }

  private async processJob(job: Job<GraphJobData>): Promise<void> {
    const { documentId, userId } = job.data;
    if (typeof documentId !== 'string' || typeof userId !== 'string') {
      throw new Error('Invalid job data: documentId or userId is missing');
    }

    this.logger.log(
      `[GraphWorker] Processing relationships for document: ${documentId}`,
    );

    await this.graphBuilder.buildRelationships(documentId, userId);
  }
}
