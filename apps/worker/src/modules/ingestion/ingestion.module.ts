import { Module } from '@nestjs/common';
import { IngestionController } from './processors/ingestion.controller';
import { QStashModule } from '@repo/queue';

@Module({
  imports: [QStashModule],
  controllers: [IngestionController],
})
export class IngestionModule {}
