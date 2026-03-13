import { Module } from '@nestjs/common';
import { IngestionWorker } from './processors/ingestion.worker';
import { BullModule } from '@repo/queue';
import { QUEUE_GRAPH, QUEUE_NOTION_SYNC } from '@repo/types';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QUEUE_GRAPH },
      { name: QUEUE_NOTION_SYNC },
    ),
  ],
  providers: [IngestionWorker],
})
export class IngestionModule {}
