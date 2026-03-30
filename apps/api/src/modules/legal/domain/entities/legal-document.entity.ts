import type { LegalDocument, LegalDocumentType } from '@repo/types';

export interface LegalDocumentEntityProps {
  id: string;
  type: LegalDocumentType;
  version: string;
  title: string;
  content: string;
  effectiveDate: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class LegalDocumentEntity {
  constructor(public readonly props: LegalDocumentEntityProps) {}

  get active(): boolean {
    return this.props.active;
  }

  toView(): LegalDocument {
    return {
      id: this.props.id,
      type: this.props.type,
      version: this.props.version,
      title: this.props.title,
      content: this.props.content,
      effectiveDate: this.props.effectiveDate,
      active: this.props.active,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
