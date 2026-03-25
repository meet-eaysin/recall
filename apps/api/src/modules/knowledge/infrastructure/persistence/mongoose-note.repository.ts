import { Injectable } from '@nestjs/common';
import { NoteModel, INoteDocument } from '@repo/db';
import { Types } from 'mongoose';
import { NoteEntity } from '../../domain/entities/note.entity';
import { INoteRepository } from '../../domain/repositories/note.repository';

@Injectable()
export class MongooseNoteRepository extends INoteRepository {
  async findAllByDocument(
    documentId: string,
    userId: string,
  ): Promise<NoteEntity[]> {
    if (!Types.ObjectId.isValid(documentId)) return [];

    const notes: INoteDocument[] = await NoteModel.find({
      documentId: new Types.ObjectId(documentId),
      userId,
    })
      .sort({ createdAt: -1 })
      .exec();

    return notes.map((n) => this.toEntity(n));
  }

  async findById(id: string, userId: string): Promise<NoteEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const note = await NoteModel.findOne({
      _id: new Types.ObjectId(id),
      userId,
    }).exec();
    return note ? this.toEntity(note) : null;
  }

  async create(
    data: Partial<NoteEntity['props']> & { userId: string; content: string },
  ): Promise<NoteEntity> {
    const note = await NoteModel.create({
      ...data,
      documentId: data.documentId
        ? new Types.ObjectId(data.documentId)
        : undefined,
    });
    return this.toEntity(note);
  }

  async update(
    id: string,
    userId: string,
    content: string,
  ): Promise<NoteEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const note = await NoteModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId },
      { content },
      { new: true },
    ).exec();
    return note ? this.toEntity(note) : null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await NoteModel.deleteOne({
      _id: new Types.ObjectId(id),
      userId,
    }).exec();
    return result.deletedCount > 0;
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await NoteModel.deleteMany({ userId }).exec();
  }

  private toEntity(doc: INoteDocument): NoteEntity {
    return NoteEntity.create({
      id: doc.id,
      userId: doc.userId,
      documentId: doc.documentId ? doc.documentId.toString() : undefined,
      content: doc.content,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
