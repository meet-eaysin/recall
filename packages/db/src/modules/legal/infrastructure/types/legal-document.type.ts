import { Document } from 'mongoose';
import { LegalDocumentType } from '@repo/types';

export interface ILegalDocument {
  type: LegalDocumentType;
  version: string;
  title: string;
  content: string;
  effectiveDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ILegalDocumentDocument = ILegalDocument & Document;
