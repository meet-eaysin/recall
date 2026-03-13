import { Module, Global } from '@nestjs/common';
import { BullModule } from '@repo/queue';
import { createBullQueueConfig } from '@repo/queue';
import { connectMongoDB } from '@repo/db';
import { env } from './shared/utils/env';

// Repositories
import { IDocumentRepository, MongooseDocumentRepository } from '@repo/db';
import { ITranscriptRepository, MongooseTranscriptRepository } from '@repo/db';
import {
  IIngestionJobRepository,
  MongooseIngestionJobRepository,
} from '@repo/db';
import { LocalStorage } from '@repo/db';
import {
  IGraphRepository,
  MongooseGraphRepository,
  INotionConfigRepository,
  MongooseNotionConfigRepository,
} from '@repo/db';

// Modules
import { EmailModule } from './modules/email/email.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { GraphModule } from './modules/graph/graph.module';
import { NotionModule } from './modules/notion/notion.module';

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      ...createBullQueueConfig({
        redis: {
          host: env.REDIS_HOST,
          port: env.REDIS_PORT,
          password: env.REDIS_PASSWORD,
        },
      }),
    }),
    EmailModule,
    DocumentsModule,
    IngestionModule,
    GraphModule,
    NotionModule,
  ],
  providers: [
    // Infrastructure
    {
      provide: LocalStorage,
      useFactory: () => {
        const storage = new LocalStorage();
        storage.setBaseDir(env.FILE_UPLOAD_DIR);
        return storage;
      },
    },
    // Repositories
    {
      provide: IDocumentRepository,
      useClass: MongooseDocumentRepository,
    },
    {
      provide: ITranscriptRepository,
      useClass: MongooseTranscriptRepository,
    },
    {
      provide: IIngestionJobRepository,
      useClass: MongooseIngestionJobRepository,
    },
    {
      provide: IGraphRepository,
      useClass: MongooseGraphRepository,
    },
    {
      provide: INotionConfigRepository,
      useClass: MongooseNotionConfigRepository,
    },
  ],
  exports: [
    IDocumentRepository,
    ITranscriptRepository,
    IIngestionJobRepository,
    IGraphRepository,
    INotionConfigRepository,
    LocalStorage,
  ],
})
export class WorkerModule {}
