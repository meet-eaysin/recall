import type { GraphNodeType } from '@repo/types';

export interface GraphNodeView {
  id: string;
  type: string;
  documentId?: string | undefined;
  label: string;
}

export interface GraphNodeEntityProps {
  id: string;
  userId: string;
  type: GraphNodeType;
  documentId?: string | undefined;
  label: string;
  createdAt: Date;
  updatedAt: Date;
  properties?: Record<string, unknown>;
}

export class GraphNodeEntity {
  constructor(public readonly props: GraphNodeEntityProps) {}

  static create(props: GraphNodeEntityProps): GraphNodeEntity {
    return new GraphNodeEntity(props);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get type(): string {
    return this.props.type;
  }

  get documentId(): string | undefined {
    return this.props.documentId;
  }

  get label(): string {
    return this.props.label;
  }

  toView(): GraphNodeView {
    const view: GraphNodeView = {
      id: this.props.id,
      type: this.props.type,
      label: this.props.label,
    };

    if (this.props.documentId !== undefined) {
      view.documentId = this.props.documentId;
    }

    return view;
  }
}
