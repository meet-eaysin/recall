import {
  Module,
  OnModuleInit,
  OnApplicationShutdown,
  Logger,
} from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { connectMongoDB, disconnectMongoDB } from '@repo/db';
import { createRedisConnection, initQueues } from '@repo/queue';
import { env } from './shared/utils/env';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './shared/filters/http-exception.filter';

// Modules
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuthModule } from './modules/auth/auth.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { GraphModule } from './modules/graph/graph.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { LLMConfigModule } from './modules/llm-config/llm-config.module';
import { NotionModule } from './modules/notion/notion.module';
import { ReviewModule } from './modules/review/review.module';
import { SearchModule } from './modules/search/search.module';
import { SummaryModule } from './modules/summary/summary.module';
import { HealthController } from './modules/health/health.controller';

@Module({
  imports: [
    AnalyticsModule,
    AuthModule,
    DocumentsModule,
    GraphModule,
    IngestionModule,
    KnowledgeModule,
    LLMConfigModule,
    NotionModule,
    ReviewModule,
    SearchModule,
    SummaryModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(AppModule.name);

  async onModuleInit() {
    await connectMongoDB(env.MONGODB_URI);
    try {
      if (env.REDIS_URL && !env.REDIS_URL.includes('localhost')) {
        initQueues(createRedisConnection(env.REDIS_URL));
      } else {
        this.logger.warn(
          'Skipping Redis initialization: REDIS_URL is localhost or missing.',
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to initialize Redis: ${message}`);
    }
  }

  async onApplicationShutdown() {
    await disconnectMongoDB();
  }
}
