import { Module } from '@nestjs/common';
import { IGraphRepository } from './domain/repositories/graph.repository';
import { MongooseGraphRepository } from './infrastructure/persistence/mongoose-graph.repository';
import { GraphBuilderService } from './domain/services/graph-builder.service';
import { GetFullGraphUseCase } from './application/use-cases/get-full-graph.usecase';
import { GetDocumentSubgraphUseCase } from './application/use-cases/get-document-subgraph.usecase';
import { RebuildDocumentGraphUseCase } from './application/use-cases/rebuild-document-graph.usecase';
import { GraphController } from './interface/graph.controller';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [DocumentsModule],
  controllers: [GraphController],
  providers: [
    {
      provide: IGraphRepository,
      useClass: MongooseGraphRepository,
    },
    GraphBuilderService,
    GetFullGraphUseCase,
    GetDocumentSubgraphUseCase,
    RebuildDocumentGraphUseCase,
  ],
  exports: [IGraphRepository, GraphBuilderService],
})
export class GraphModule {}
