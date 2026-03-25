import { Injectable } from '@nestjs/common';
import { TagModel, ITagDocument } from '@repo/db';
import { Types } from 'mongoose';
import { TagEntity } from '../../domain/entities/tag.entity';
import { ITagRepository } from '../../domain/repositories/tag.repository';

@Injectable()
export class MongooseTagRepository extends ITagRepository {
  async findAll(userId: string): Promise<TagEntity[]> {
    const tags: ITagDocument[] = await TagModel.find({ userId })
      .sort({ name: 1 })
      .exec();
    return tags.map((t) => this.toEntity(t));
  }

  async findById(id: string, userId: string): Promise<TagEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const tag = await TagModel.findOne({
      _id: new Types.ObjectId(id),
      userId,
    }).exec();
    return tag ? this.toEntity(tag) : null;
  }

  async findByName(name: string, userId: string): Promise<TagEntity | null> {
    const tag = await TagModel.findOne({ name, userId }).exec();
    return tag ? this.toEntity(tag) : null;
  }

  async findByIds(ids: string[], userId: string): Promise<TagEntity[]> {
    const validIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (validIds.length === 0) return [];

    const tags = await TagModel.find({ _id: { $in: validIds }, userId }).exec();
    return tags.map((t) => this.toEntity(t));
  }

  async create(
    data: Partial<TagEntity['props']> & { userId: string; name: string },
  ): Promise<TagEntity> {
    const tag = await TagModel.create(data);
    return this.toEntity(tag);
  }

  async update(
    id: string,
    userId: string,
    data: Partial<TagEntity['props']>,
  ): Promise<TagEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const tag = await TagModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId },
      data,
      { new: true },
    ).exec();
    return tag ? this.toEntity(tag) : null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await TagModel.deleteOne({
      _id: new Types.ObjectId(id),
      userId,
    }).exec();
    return result.deletedCount > 0;
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await TagModel.deleteMany({ userId }).exec();
  }

  private toEntity(doc: ITagDocument): TagEntity {
    return TagEntity.create({
      id: doc.id,
      userId: doc.userId,
      name: doc.name,
      source: doc.source,
      color: doc.color,
      createdAt: doc.createdAt,
    });
  }
}
