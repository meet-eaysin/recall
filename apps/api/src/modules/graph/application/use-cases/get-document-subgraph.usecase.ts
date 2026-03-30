import { Injectable } from '@nestjs/common';
import { IGraphRepository } from '../../domain/repositories/graph.repository';
import { GraphNodeView } from '../../domain/entities/graph-node.entity';
import { NotFoundDomainException } from '../../../../shared/errors/not-found.exception';
import { GraphEdgeView } from '../../domain/entities/graph-edge.entity';

export interface DocumentSubgraphResponse {
  node: GraphNodeView;
  directEdges: GraphEdgeView[];
  neighborNodes: GraphNodeView[];
}

@Injectable()
export class GetDocumentSubgraphUseCase {
  constructor(private readonly graphRepository: IGraphRepository) {}

  async execute(
    documentId: string,
    userId: string,
  ): Promise<DocumentSubgraphResponse> {
    const node = await this.graphRepository.findNodeByDocumentId(
      userId,
      documentId,
    );
    if (!node) {
      throw new NotFoundDomainException('Graph node for document not found');
    }

    const directEdges = await this.graphRepository.findDirectEdges(
      node.id,
      userId,
    );

    const neighborIds = new Set<string>();
    for (const edge of directEdges) {
      if (edge.props.fromNodeId !== node.id)
        neighborIds.add(edge.props.fromNodeId);
      if (edge.props.toNodeId !== node.id) neighborIds.add(edge.props.toNodeId);
    }

    const neighborNodes = await this.graphRepository.findNodesByIds(
      Array.from(neighborIds),
    );

    return {
      node: node.toView(),
      directEdges: directEdges.map((e) => e.toView()),
      neighborNodes: neighborNodes.map((n) => n.toView()),
    };
  }
}
