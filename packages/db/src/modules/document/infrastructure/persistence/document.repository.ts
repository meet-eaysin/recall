import { Injectable, Logger } from '@nestjs/common';
import { Types, FilterQuery, SortOrder } from 'mongoose';
import { DocFilters, IngestionStatusView } from '@repo/types';
import { DocumentModel } from '../persistence/document.model';
import {
  IDocumentDocument,
  IDocument,
  IngestionStatus,
} from '../types/document.type';
import { IDocumentRepository } from '../../domain/repository.interface';
import { DocumentEntity } from '../../domain/entity';

@Injectable()
export class MongooseDocumentRepository extends IDocumentRepository {
  private readonly logger = new Logger(MongooseDocumentRepository.name);

  async findById(id: string, userId: string): Promise<DocumentEntity | null> {
    if (!Types.ObjectId.isValid(id)) {
      this.logger.warn(`Invalid ObjectId: ${id}`);
      return null;
    }

    const doc = await DocumentModel.findOne({
      _id: new Types.ObjectId(id),
      userId,
    })
      .lean<IDocument>()
      .exec();

    if (!doc) return null;
    return this.toEntity(doc);
  }

  async findAll(
    userId: string,
    filters: DocFilters,
  ): Promise<{ docs: DocumentEntity[]; total: number }> {
    const query: FilterQuery<IDocumentDocument> = { userId };

    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;
    if (filters.folderIds?.length) {
      query.folderId = {
        $in: filters.folderIds.map((id: string) => new Types.ObjectId(id)),
      };
    }
    if (filters.tagIds?.length) {
      query.tags = { $in: filters.tagIds };
    }
    if (filters.q) {
      query.$text = { $search: filters.q };
    }

    const sortOption: { [key: string]: SortOrder | { $meta: 'textScore' } } =
      filters.q ? { score: { $meta: 'textScore' } } : { createdAt: -1 };

    const [docs, total] = await Promise.all([
      DocumentModel.find(query)
        .sort(sortOption)
        .skip((Number(filters.page) - 1) * Number(filters.limit))
        .limit(Number(filters.limit))
        .lean<IDocument[]>()
        .exec(),
      DocumentModel.countDocuments(query).exec(),
    ]);

    return {
      docs: docs.map((doc) => this.toEntity(doc)),
      total,
    };
  }

  async create(doc: DocumentEntity): Promise<DocumentEntity> {
    const raw = this.toRaw(doc);
    const created = await DocumentModel.create(raw);
    const leanDoc = created.toObject<IDocument>();
    return this.toEntity(leanDoc);
  }

  async update(
    id: string,
    userId: string,
    data: Record<string, unknown>,
  ): Promise<DocumentEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const updated = await DocumentModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId },
      { $set: data },
      { new: true },
    )
      .lean<IDocument>()
      .exec();

    if (!updated) return null;
    return this.toEntity(updated);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await DocumentModel.deleteOne({
      _id: new Types.ObjectId(id),
      userId,
    }).exec();
    return result.deletedCount > 0;
  }

  async existsBySource(userId: string, source: string): Promise<string | null> {
    const doc = await DocumentModel.findOne({
      userId,
      sourceUrl: source,
    })
      .select('_id')
      .lean<{ _id: Types.ObjectId }>()
      .exec();

    return doc ? doc._id.toString() : null;
  }

  async getIngestionStatus(
    id: string,
    userId: string,
  ): Promise<IngestionStatusView | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await DocumentModel.findOne({
      _id: new Types.ObjectId(id),
      userId,
    })
      .select('ingestionStatus currentStage embeddingsReady ingestionError')
      .lean<IDocument>()
      .exec();

    if (!doc) return null;

    return {
      ingestionStatus: doc.ingestionStatus ?? undefined,
      currentStage: doc.currentStage ?? undefined,
      embeddingsReady: doc.embeddingsReady === true,
      ingestionError: doc.ingestionError ?? undefined,
    };
  }

  async removeFolderFromAll(folderId: string, userId: string): Promise<void> {
    await DocumentModel.updateMany(
      { userId, folderId: new Types.ObjectId(folderId) },
      { $unset: { folderId: '' } },
    ).exec();
  }

  async removeTagFromAll(tagId: string, userId: string): Promise<void> {
    await DocumentModel.updateMany(
      { userId, tags: tagId },
      { $pull: { tags: tagId } },
    ).exec();
  }

  private toEntity(doc: IDocument): DocumentEntity {
    return DocumentEntity.create({
      id: doc._id.toString(),
      userId: doc.userId,
      folderId: doc.folderId?.toString() ?? undefined,
      title: doc.title,
      content: doc.content,
      type: doc.type,
      status: doc.status,
      sourceType: doc.sourceType,
      sourceUrl: doc.sourceUrl ?? undefined,
      mimeType: doc.mimeType ?? undefined,
      tags: doc.tags || [],
      summary: doc.summary ?? undefined,
      metadata: doc.metadata || {},
      lastOpenedAt: doc.lastOpenedAt ?? undefined,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      ingestionStatus: doc.ingestionStatus ?? undefined,
      currentStage: doc.currentStage ?? undefined,
      embeddingsReady: doc.embeddingsReady === true,
      ocrConfidence: doc.ocrConfidence ?? undefined,
      chunkCount: doc.chunkCount ?? undefined,
      ingestionError: doc.ingestionError ?? undefined,
    });
  }

  private toRaw(entity: DocumentEntity): IDocument {
    const props = entity.props;
    return {
      _id:
        entity.id && Types.ObjectId.isValid(entity.id)
          ? new Types.ObjectId(entity.id)
          : new Types.ObjectId(),
      userId: entity.userId,
      title: props.title,
      content: props.content,
      type: props.type,
      status: props.status,
      sourceType: props.sourceType,
      sourceUrl: props.sourceUrl ?? undefined,
      mimeType: props.mimeType ?? undefined,
      tags: props.tags,
      metadata: props.metadata,
      embeddingsReady: props.embeddingsReady,
      folderId: props.folderId
        ? new Types.ObjectId(String(props.folderId))
        : undefined,
      ingestionStatus: props.ingestionStatus ?? IngestionStatus.PENDING,
      currentStage: props.currentStage ?? undefined,
      ocrConfidence: props.ocrConfidence ?? undefined,
      chunkCount: props.chunkCount ?? undefined,
      ingestionError: props.ingestionError ?? undefined,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      summary: props.summary ?? undefined,
      lastOpenedAt: props.lastOpenedAt ?? undefined,
    };
  }
}
