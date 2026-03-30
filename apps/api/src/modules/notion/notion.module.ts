import { Module } from '@nestjs/common';
import { NotionClient } from './infrastructure/notion-client';
import { ConnectNotionUseCase } from './application/use-cases/connect-notion.usecase';
import { GetNotionConfigUseCase } from './application/use-cases/get-notion-config.usecase';
import { ListNotionDatabasesUseCase } from './application/use-cases/list-notion-databases.usecase';
import { UpdateNotionConfigUseCase } from './application/use-cases/update-notion-config.usecase';
import { SyncAllToNotionUseCase } from './application/use-cases/sync-all-to-notion.usecase';
import { DisconnectNotionUseCase } from './application/use-cases/disconnect-notion.usecase';
import { NotionController } from './interface/notion.controller';
import { INotionConfigRepository } from './domain/repositories/notion-config.repository';
import { MongooseNotionConfigRepository } from './infrastructure/persistence/mongoose-notion-config.repository';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [DocumentsModule],
  controllers: [NotionController],
  providers: [
    NotionClient,
    ConnectNotionUseCase,
    DisconnectNotionUseCase,
    GetNotionConfigUseCase,
    ListNotionDatabasesUseCase,
    SyncAllToNotionUseCase,
    UpdateNotionConfigUseCase,
    {
      provide: INotionConfigRepository,
      useClass: MongooseNotionConfigRepository,
    },
  ],
  exports: [INotionConfigRepository, NotionClient],
})
export class NotionModule {}
