import { Module } from '@nestjs/common';
import { NotionController } from './processors/notion.controller';

@Module({
  controllers: [NotionController],
})
export class NotionModule {}
