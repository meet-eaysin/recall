import type { GraphRelationType, GraphGenerationMethod } from '@repo/types';

export interface GraphEdgeView {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  relationType: string;
  weight: number;
}

export interface GraphEdgeEntityProps {
  id: string;
  userId: string;
  fromNodeId: string;
  toNodeId: string;
  relationType: GraphRelationType;
  weight: number;
  generationMethod: GraphGenerationMethod;
  createdAt: Date;
  updatedAt: Date;
  properties?: Record<string, unknown>;
}

export class GraphEdgeEntity {
  constructor(public readonly props: GraphEdgeEntityProps) {}

  static create(props: GraphEdgeEntityProps): GraphEdgeEntity {
    return new GraphEdgeEntity(props);
  }

  get id(): string {
    return this.props.id;
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
