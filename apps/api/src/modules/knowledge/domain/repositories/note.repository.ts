import type { NoteEntity } from '../entities/note.entity';

export abstract class INoteRepository {
  abstract findAllByDocument(
    documentId: string,
    userId: string,
  ): Promise<NoteEntity[]>;
  abstract findById(id: string, userId: string): Promise<NoteEntity | null>;
  abstract create(
    note: Partial<NoteEntity['props']> & { userId: string; content: string },
  ): Promise<NoteEntity>;
  abstract update(
    id: string,
    userId: string,
    content: string,
  ): Promise<NoteEntity | null>;
  abstract delete(id: string, userId: string): Promise<boolean>;
}
