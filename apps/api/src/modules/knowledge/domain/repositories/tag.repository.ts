import type { TagEntity } from '../entities/tag.entity';

export abstract class ITagRepository {
  abstract findAll(userId: string): Promise<TagEntity[]>;
  abstract findById(id: string, userId: string): Promise<TagEntity | null>;
  abstract findByName(name: string, userId: string): Promise<TagEntity | null>;
  abstract findByIds(ids: string[], userId: string): Promise<TagEntity[]>;
  abstract create(
    tag: Partial<TagEntity['props']> & { userId: string; name: string },
  ): Promise<TagEntity>;
  abstract update(
    id: string,
    userId: string,
    data: Partial<TagEntity['props']>,
  ): Promise<TagEntity | null>;
  abstract delete(id: string, userId: string): Promise<boolean>;
}
