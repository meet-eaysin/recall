import { Module, Global } from '@nestjs/common';
import { env } from './shared/utils/env';
import { StorageModule } from '@repo/storage';
import { InternalApiClientService } from './shared/services/internal-api-client.service';

// Modules
import { EmailModule } from './modules/email/email.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { GraphModule } from './modules/graph/graph.module';
import { NotionModule } from './modules/notion/notion.module';

import { CacheModule } from '@repo/cache';
import { QueueModule as SharedQueueModule } from '@repo/queue';

import { LlmModule } from './modules/llm/llm.module';

@Global()
@Module({
  imports: [
    CacheModule.forRoot({
      provider: env.CACHE_PROVIDER,
      upstash: {
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      },
      redis: {
        url: env.REDIS_URL,
      },
    }),
    SharedQueueModule.forRoot({
      provider: env.QUEUE_PROVIDER,
      qstash: {
        token: env.QSTASH_TOKEN,
        baseUrl: env.QSTASH_URL,
        workerUrl: env.WORKER_URL,
        devBypass: env.NODE_ENV === 'development',
      },

      http: {
        baseUrl: env.WORKER_URL,
        devBypassHeader: true,
      },
    }),
    StorageModule.forRoot({
      provider: env.STORAGE_PROVIDER,
      disk: {
        baseDir: env.FILE_UPLOAD_DIR,
      },
      supabase: {
        url: env.SUPABASE_URL,
        key: env.SUPABASE_KEY,
      },
    }),
    LlmModule,
    EmailModule,
    DocumentsModule,
    IngestionModule,
    GraphModule,
    NotionModule,
  ],
  providers: [InternalApiClientService],
  exports: [InternalApiClientService],
})
export class WorkerModule {}
