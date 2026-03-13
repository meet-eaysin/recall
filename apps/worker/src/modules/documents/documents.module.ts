import { Module } from '@nestjs/common';
import { SummaryWorker } from './processors/summary.worker';
import { TranscriptWorker } from './processors/transcript.worker';

@Module({
  providers: [SummaryWorker, TranscriptWorker],
})
export class DocumentsModule {}
