import type {
  DocumentType,
  DocumentStatus,
  DocumentPublicView,
  DocumentDetailView,
  DocumentEntityProps,
  IngestionStatus,
} from '@repo/types';

export class DocumentEntity {
  constructor(public readonly props: DocumentEntityProps) {}

  static create(props: DocumentEntityProps): DocumentEntity {
    return new DocumentEntity(props);
  }

  toPublicView(): DocumentPublicView {
    return {
      id: this.props.id,
      userId: this.props.userId,
      folderId: this.props.folderId,
      title: this.props.title,
      type: this.props.type,
      status: this.props.status,
      sourceType: this.props.sourceType,
      sourceUrl: this.props.sourceUrl,
      tags: this.props.tags,
      lastOpenedAt: this.props.lastOpenedAt,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  toDetailView(): DocumentDetailView {
    return {
      ...this.toPublicView(),
      content: this.props.content,
      summary: this.props.summary,
      metadata: this.props.metadata,
    };
  }

  get id(): string {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get title(): string {
    return this.props.title;
  }
  get embeddingsReady(): boolean {
    return this.props.embeddingsReady;
  }
  get ingestionStatus(): IngestionStatus | undefined {
    return this.props.ingestionStatus;
  }
  get sourceUrl(): string | undefined {
    return this.props.sourceUrl;
  }
  get type(): DocumentType {
    return this.props.type;
  }
  get status(): DocumentStatus {
    return this.props.status;
  }
  get content(): string | undefined {
    return this.props.content;
  }
}
