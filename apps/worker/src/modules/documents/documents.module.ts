import { Module } from '@nestjs/common';
import { SummaryController } from './processors/summary.controller';
import { TranscriptController } from './processors/transcript.controller';

@Module({
  controllers: [SummaryController, TranscriptController],
})
export class DocumentsModule {}
