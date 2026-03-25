import { Injectable } from '@nestjs/common';
import { DocumentModel, FolderModel, IFolderDocument } from '@repo/db';
import { Types } from 'mongoose';
import { FolderEntity } from '../../domain/entities/folder.entity';
import { IFolderRepository } from '../../domain/repositories/folder.repository';

@Injectable()
export class MongooseFolderRepository extends IFolderRepository {
  async findAll(userId: string): Promise<FolderEntity[]> {
    const folders: IFolderDocument[] = await FolderModel.find({ userId })
      .sort({ name: 1 })
      .exec();
    return folders.map((f) => this.toEntity(f));
  }

  async findById(id: string, userId: string): Promise<FolderEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const folder = await FolderModel.findOne({
      _id: new Types.ObjectId(id),
      userId,
    }).exec();
    return folder ? this.toEntity(folder) : null;
  }

  async create(
    data: Partial<FolderEntity['props']> & { userId: string; name: string },
  ): Promise<FolderEntity> {
    const folder = await FolderModel.create({
      ...data,
      parentId: data.parentId ? new Types.ObjectId(data.parentId) : undefined,
    });
    return this.toEntity(folder);
  }

  async findByName(
    name: string,
    userId: string,
    parentId?: string | null,
  ): Promise<FolderEntity | null> {
    const query: Record<string, unknown> = {
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      userId,
    };

    if (parentId) {
      query.parentId = new Types.ObjectId(parentId);
    } else {
      query.parentId = null;
    }

    const folder = await FolderModel.findOne(query).exec();
    return folder ? this.toEntity(folder) : null;
  }

  async update(
    id: string,
    userId: string,
    data: Partial<FolderEntity['props']>,
  ): Promise<FolderEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const updateData: Record<string, unknown> = { ...data };
    if (data.parentId) {
      updateData.parentId = new Types.ObjectId(data.parentId);
    } else if (data.parentId === null) {
      updateData.$unset = { parentId: '' };
    }

    const folder = await FolderModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId },
      updateData,
      { new: true },
    ).exec();

    return folder ? this.toEntity(folder) : null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await FolderModel.deleteOne({
      _id: new Types.ObjectId(id),
      userId,
    }).exec();
    return result.deletedCount > 0;
  }

  async countDocuments(folderId: string, userId: string): Promise<number> {
    if (!Types.ObjectId.isValid(folderId)) return 0;
    return DocumentModel.countDocuments({
      folderId: new Types.ObjectId(folderId),
      userId,
    }).exec();
  }

  private toEntity(doc: IFolderDocument): FolderEntity {
    return FolderEntity.create({
      id: doc.id,
      userId: doc.userId,
      parentId: doc.parentId ? doc.parentId.toString() : undefined,
      name: doc.name,
      description: doc.description,
      color: doc.color,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
