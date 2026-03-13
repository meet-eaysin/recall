import { Injectable } from '@nestjs/common';
import { InjectQueue, Queue } from '@repo/queue';
import { GraphJobData, QUEUE_GRAPH } from '@repo/types';
import { IGraphRepository } from '../../domain/repositories/graph.repository';

@Injectable()
export class RebuildDocumentGraphUseCase {
  constructor(
    private readonly graphRepository: IGraphRepository,
    @InjectQueue(QUEUE_GRAPH)
    private readonly graphQueue: Queue<GraphJobData>,
  ) {}

  async execute(documentId: string, userId: string): Promise<string> {
    await this.graphRepository.deleteEdgesForDocument(documentId, userId);

    await this.graphQueue.add('graph', { documentId, userId });

    return 'triggered';
  }
}
