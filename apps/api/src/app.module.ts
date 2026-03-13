import {
  Module,
  OnModuleInit,
  OnApplicationShutdown,
  Logger,
} from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { connectMongoDB, disconnectMongoDB } from '@repo/db';
import { env } from './shared/utils/env';
import { AllExceptionsFilter } from './shared/filters/http-exception.filter';

// Modules
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/infrastructure/guards/jwt-auth.guard';
import { DevUserGuard } from './shared/guards/dev-user.guard';
import { DocumentsModule } from './modules/documents/documents.module';
import { GraphModule } from './modules/graph/graph.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { LLMConfigModule } from './modules/llm-config/llm-config.module';
import { NotionModule } from './modules/notion/notion.module';
import { ReviewModule } from './modules/review/review.module';
import { SearchModule } from './modules/search/search.module';
import { QueueModule } from './modules/queue/queue.module';
import { UsersModule } from './modules/users/users.module';
import { HealthController } from './modules/health/health.controller';
import { TransformInterceptor } from './shared/interceptors/transform.interceptor';

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
    QueueModule,
    ReviewModule,
    SearchModule,
    UsersModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass:
        env.NODE_ENV === 'development' && env.DEV_AUTH_ENABLED
          ? DevUserGuard
          : JwtAuthGuard,
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
  }

  async onApplicationShutdown() {
    await disconnectMongoDB();
  }
}
