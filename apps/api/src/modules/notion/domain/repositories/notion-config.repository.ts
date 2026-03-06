import { NotionConfigEntity } from '../entities/notion-config.entity';

export abstract class INotionConfigRepository {
  abstract findByUserId(userId: string): Promise<NotionConfigEntity | null>;
  abstract save(entity: NotionConfigEntity): Promise<void>;
  abstract deleteByUserId(userId: string): Promise<void>;
}
