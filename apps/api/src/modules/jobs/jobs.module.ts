import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module';
import { GraphModule } from '../graph/graph.module';
import { IngestionModule } from '../ingestion/ingestion.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { NotionModule } from '../notion/notion.module';
import { WorkerJobService } from './application/worker-job.service';
import { InternalJobsController } from './presentation/internal-jobs.controller';

@Module({
  imports: [
    DocumentsModule,
    GraphModule,
    IngestionModule,
    KnowledgeModule,
    NotionModule,
  ],
  providers: [WorkerJobService],
  controllers: [InternalJobsController],
})
export class JobsModule {}
