import type { FolderEntity } from '../entities/folder.entity';

export abstract class IFolderRepository {
  abstract findAll(userId: string): Promise<FolderEntity[]>;
  abstract findById(id: string, userId: string): Promise<FolderEntity | null>;
  abstract create(
    folder: Partial<FolderEntity['props']> & { userId: string; name: string },
  ): Promise<FolderEntity>;
  abstract update(
    id: string,
    userId: string,
    data: Partial<FolderEntity['props']>,
  ): Promise<FolderEntity | null>;
  abstract delete(id: string, userId: string): Promise<boolean>;
  abstract countDocuments(folderId: string, userId: string): Promise<number>;
}
