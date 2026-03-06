import { Module } from '@nestjs/common';
import { GetHeatmapUseCase } from './application/use-cases/get-heatmap.usecase';
import { GetStatsUseCase } from './application/use-cases/get-stats.usecase';
import { AnalyticsController } from './interface/controllers/analytics.controller';
import { IUserActivityRepository } from './domain/repositories/user-activity.repository';
import { MongooseUserActivityRepository } from './infrastructure/persistence/mongoose-user-activity.repository';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [DocumentsModule],
  controllers: [AnalyticsController],
  providers: [
    GetHeatmapUseCase,
    GetStatsUseCase,
    {
      provide: IUserActivityRepository,
      useClass: MongooseUserActivityRepository,
    },
  ],
  exports: [IUserActivityRepository],
})
export class AnalyticsModule {}
