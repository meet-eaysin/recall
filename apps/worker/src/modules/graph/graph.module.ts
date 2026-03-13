import { Module } from '@nestjs/common';
import { GraphBuilderService } from './graph-builder.service';
import { GraphController } from './processors/graph.controller';

@Module({
  providers: [GraphBuilderService],
  controllers: [GraphController],
})
export class GraphModule {}
