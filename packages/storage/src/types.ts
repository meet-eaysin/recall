import { Readable } from 'stream';

export interface UploadOptions {
  contentType?: string;
  isPublic?: boolean;
}

export abstract class IStorageProvider {
  abstract upload(file: Buffer | Readable, path: string, options?: UploadOptions): Promise<string>;
  abstract getPublicUrl(path: string): string;
  abstract getSignedUrl(path: string, expiresIn?: number): Promise<string>;
  abstract delete(path: string): Promise<void>;
  abstract download(path: string): Promise<Buffer>;
}

export type StorageProviderType = 'disk' | 'supabase' | 's3';

export interface StorageConfig {
  provider: StorageProviderType;
  disk?: {
    baseDir: string;
  };
  supabase?: {
    url: string;
    key: string;
    bucket?: string;
  };
  s3?: {
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
  };
}
