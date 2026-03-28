import { Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Readable } from 'node:stream';
import * as tus from 'tus-js-client';
import { IStorageProvider, UploadOptions } from '../types';

export class SupabaseStorageProvider extends IStorageProvider {
  private readonly logger = new Logger(SupabaseStorageProvider.name);
  private client: SupabaseClient;
  private readonly projectId: string;
  private readonly RESUMABLE_THRESHOLD = 6 * 1024 * 1024; // 6MB
  private initialized = false;

  constructor(
    url: string,
    private readonly key: string,
    private readonly bucket: string,
  ) {
    super();
    this.client = createClient(url, key);
    // Extract project ID from URL (e.g., https://xyz.supabase.co -> xyz)
    const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/);
    this.projectId = match?.[1] ?? '';
  }

  private async ensureBucketExists(): Promise<void> {
    if (this.initialized) return;

    try {
      const { data: _bucket, error: getError } = await this.client.storage.getBucket(this.bucket);
      
      if (getError) {
        // If bucket doesn't exist, try to create it
        if (getError.message.includes('not found') || (getError as any).status === 404) {
          this.logger.log(`Bucket '${this.bucket}' not found. Attempting to create...`);
          const { error: createError } = await this.client.storage.createBucket(this.bucket, {
            public: false, // Default to private for better security
          });

          if (createError) {
            this.logger.error(`Failed to create bucket '${this.bucket}': ${createError.message}`);
          } else {
            this.logger.log(`Bucket '${this.bucket}' created successfully.`);
          }
        } else {
          this.logger.warn(`Could not verify bucket '${this.bucket}': ${getError.message}`);
        }
      }

      this.initialized = true;
    } catch (err) {
      this.logger.error(`Error checking Supabase bucket '${this.bucket}':`, err);
      // We set initialized to true anyway to avoid repeated fails on every upload
      this.initialized = true;
    }
  }

  async upload(
    file: Buffer | Readable,
    path: string,
    options?: UploadOptions,
  ): Promise<string> {
    await this.ensureBucketExists();

    // If it's a Buffer and below threshold, use standard upload
    if (file instanceof Buffer && file.length < this.RESUMABLE_THRESHOLD) {
      return this.standardUpload(file, path, options);
    }

    // Otherwise use resumable (TUS) for better reliability with streams/large files
    return this.resumableUpload(file, path, options);
  }

  private async standardUpload(
    file: Buffer | Readable,
    path: string,
    options?: UploadOptions,
  ): Promise<string> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .upload(path, file, {
        contentType: options?.contentType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Supabase standard upload failed: ${error.message}`);
    }

    return data.path;
  }

  private async resumableUpload(
    file: Buffer | Readable,
    path: string,
    options?: UploadOptions,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const upload = new tus.Upload(file, {
        endpoint: `https://${this.projectId}.storage.supabase.co/storage/v1/upload/resumable`,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          authorization: `Bearer ${this.key}`,
          'x-upsert': 'true',
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: {
          bucketName: this.bucket,
          objectName: path,
          contentType: options?.contentType ?? 'application/octet-stream',
        },
        chunkSize: 6 * 1024 * 1024,
        onError: (error) => {
          reject(new Error(`Supabase resumable upload failed: ${error.message}`));
        },
        onSuccess: () => {
          resolve(path);
        },
      });

      upload.start();
    });
  }

  getPublicUrl(path: string): string {
    const { data } = this.client.storage.from(this.bucket).getPublicUrl(path);

    return data.publicUrl;
  }

  async getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  async delete(path: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).remove([path]);

    if (error) {
      throw new Error(`Supabase delete failed: ${error.message}`);
    }
  }

  async download(path: string): Promise<Buffer> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .download(path);

    if (error) {
      throw new Error(`Supabase download failed: ${error.message}`);
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
