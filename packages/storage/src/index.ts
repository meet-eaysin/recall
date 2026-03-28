import { IStorageProvider, StorageConfig } from './types';
import { DiskStorageProvider } from './providers/disk.storage';
import { SupabaseStorageProvider } from './providers/supabase.storage';

export * from './types';
export * from './providers/disk.storage';
export * from './providers/supabase.storage';
export * from './storage.module';

export function createStorageProvider(config: StorageConfig): IStorageProvider {
  switch (config.provider) {
    case 'disk':
      if (!config.disk) {
        throw new Error('Disk storage configuration is missing');
      }
      return new DiskStorageProvider(config.disk.baseDir);
    case 'supabase':
      if (!config.supabase) {
        throw new Error('Supabase storage configuration is missing');
      }
      return new SupabaseStorageProvider(
        config.supabase.url,
        config.supabase.key,
        config.supabase.bucket ?? 'recall',
      );
    default:
      throw new Error(`Unsupported storage provider: ${config.provider}`);
  }
}
