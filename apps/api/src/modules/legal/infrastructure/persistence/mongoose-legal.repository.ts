import { Injectable } from '@nestjs/common';
import { LegalDocumentModel } from '@repo/db';
import type { LegalDocumentType } from '@repo/types';
import { ILegalRepository } from '../../domain/repositories/legal.repository';
import { LegalDocumentEntity } from '../../domain/entities/legal-document.entity';

@Injectable()
export class MongooseLegalRepository extends ILegalRepository {
  async findActivePolicy(
    type: LegalDocumentType,
  ): Promise<LegalDocumentEntity | null> {
    const document = await LegalDocumentModel.findOne({ type, active: true })
      .sort({ effectiveDate: -1 })
      .exec();

    return document ? this.toEntity(document) : null;
  }

  async findByVersion(
    type: LegalDocumentType,
    version: string,
  ): Promise<LegalDocumentEntity | null> {
    const document = await LegalDocumentModel.findOne({ type, version }).exec();
    return document ? this.toEntity(document) : null;
  }

  async create(
    data: ConstructorParameters<typeof LegalDocumentEntity>[0],
  ): Promise<LegalDocumentEntity> {
    const document = await LegalDocumentModel.create(data);
    return this.toEntity(document);
  }

  private toEntity(document: {
    _id: { toString(): string };
    type: LegalDocumentType;
    version: string;
    title: string;
    content: string;
    effectiveDate: Date;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): LegalDocumentEntity {
    return new LegalDocumentEntity({
      id: document._id.toString(),
      type: document.type,
      version: document.version,
      title: document.title,
      content: document.content,
      effectiveDate: document.effectiveDate,
      active: document.active,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  }
}
