import { Injectable } from '@nestjs/common';
import { LegalDocumentModel } from '@repo/db';
import type { ILegalDocumentDocument } from '@repo/db';
import type { LegalDocumentType } from '@repo/types';
import { ILegalRepository } from '../../domain/repositories/legal.repository';

@Injectable()
export class MongooseLegalRepository extends ILegalRepository {
  async findActivePolicy(type: LegalDocumentType): Promise<ILegalDocumentDocument | null> {
    return LegalDocumentModel.findOne({ type, active: true }).sort({ effectiveDate: -1 }).exec();
  }

  async findAllActive(): Promise<ILegalDocumentDocument[]> {
    return LegalDocumentModel.find({ active: true }).exec();
  }

  async findByVersion(type: LegalDocumentType, version: string): Promise<ILegalDocumentDocument | null> {
    return LegalDocumentModel.findOne({ type, version }).exec();
  }

  async create(data: Partial<ILegalDocumentDocument>): Promise<ILegalDocumentDocument> {
    return LegalDocumentModel.create(data);
  }
}
