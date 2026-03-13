import { Module } from '@nestjs/common';
import { NotionClient } from './notion-client';
import { NotionWorker } from './processors/notion.worker';

@Module({
  providers: [NotionClient, NotionWorker],
})
export class NotionModule {}
