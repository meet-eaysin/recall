import { Processor, WorkerHost, Job } from '@repo/queue';
import { Logger } from '@nestjs/common';
import { EmailJobData, QUEUE_EMAILS } from '@repo/types';

@Processor(QUEUE_EMAILS)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  async process(job: Job<EmailJobData>): Promise<void> {
    const { to, subject, body } = job.data;
    const jobId = job.id ?? 'unknown';
    this.logger.log(`Processing email job ${jobId} for recipient ${to}`);

    // Real mail provider integration should go here.
    this.logger.debug(`Email subject="${subject}" bodyLength=${body.length}`);
  }
}
