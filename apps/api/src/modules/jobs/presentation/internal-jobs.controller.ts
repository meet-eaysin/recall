import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import type {
  GraphJobData,
  IngestionJobData,
  NotionSyncJobData,
  SummaryJobData,
  TranscriptJobData,
} from '@repo/types';
import { Public } from '../../../shared/decorators/public.decorator';
import { InternalWorkerGuard } from '../../../shared/guards/internal-worker.guard';
import { WorkerJobService } from '../application/worker-job.service';

@Public()
@UseGuards(InternalWorkerGuard)
@Controller('internal/worker/jobs')
export class InternalJobsController {
  constructor(private readonly workerJobService: WorkerJobService) {}

  @Post('ingestion')
  async processIngestion(@Body() data: IngestionJobData): Promise<void> {
    await this.workerJobService.processIngestionJob(data);
  }

  @Post('summary')
  async processSummary(@Body() data: SummaryJobData): Promise<void> {
    await this.workerJobService.processSummaryJob(data);
  }

  @Post('transcript')
  async processTranscript(@Body() data: TranscriptJobData): Promise<void> {
    await this.workerJobService.processTranscriptJob(data);
  }

  @Post('graph')
  async processGraph(@Body() data: GraphJobData): Promise<void> {
    await this.workerJobService.processGraphJob(data);
  }

  @Post('notion-sync')
  async processNotionSync(@Body() data: NotionSyncJobData): Promise<void> {
    await this.workerJobService.processNotionSyncJob(data);
  }
}
