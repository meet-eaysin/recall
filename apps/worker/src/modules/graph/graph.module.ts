import { Module } from '@nestjs/common';
import { GraphController } from './processors/graph.controller';

@Module({
  controllers: [GraphController],
})
export class GraphModule {}
