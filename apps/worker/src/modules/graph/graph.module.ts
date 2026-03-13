import { Module } from '@nestjs/common';
import { GraphBuilderService } from './graph-builder.service';
import { GraphWorker } from './processors/graph.worker';

@Module({
  providers: [GraphBuilderService, GraphWorker],
})
export class GraphModule {}
