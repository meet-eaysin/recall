import { Module } from '@nestjs/common';
import { NotionClient } from './notion-client';
import { NotionController } from './processors/notion.controller';

@Module({
  providers: [NotionClient],
  controllers: [NotionController],
})
export class NotionModule {}
