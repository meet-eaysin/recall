import type {
  GraphRelationType,
  GraphGenerationMethod,
  GraphEdgeView,
  GraphEdgeEntityProps,
} from '@repo/types';

export class GraphEdgeEntity {
  constructor(public readonly props: GraphEdgeEntityProps) {}

  static create(props: GraphEdgeEntityProps): GraphEdgeEntity {
    return new GraphEdgeEntity(props);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get fromNodeId(): string {
    return this.props.fromNodeId;
  }

  get toNodeId(): string {
    return this.props.toNodeId;
  }

  get relationType(): GraphRelationType {
    return this.props.relationType;
  }

  get weight(): number {
    return this.props.weight;
  }

  get generationMethod(): GraphGenerationMethod {
    return this.props.generationMethod;
  }

  toView(): GraphEdgeView {
    return {
      id: this.props.id,
      fromNodeId: this.props.fromNodeId,
      toNodeId: this.props.toNodeId,
      relationType: this.props.relationType,
      weight: this.props.weight,
    };
  }
}
