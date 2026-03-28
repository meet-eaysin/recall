import fs from 'node:fs/promises';
import path from 'node:path';
import { IStorageProvider, UploadOptions } from '../types';

export class DiskStorageProvider extends IStorageProvider {
  constructor(private readonly baseDir: string) {
    super();
  }

  async upload(
    file: Buffer,
    filePath: string,
    _options?: UploadOptions,
  ): Promise<string> {
    const fullPath = path.join(this.baseDir, filePath);
    const dir = path.dirname(fullPath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, file);

    return filePath;
  }

  getPublicUrl(filePath: string): string {
    // For local storage, you might return a URL that points to a static file route in your API
    return `/uploads/${filePath}`;
  }

  async getSignedUrl(filePath: string): Promise<string> {
    // Disk provider doesn't support signing in this simple implementation
    return this.getPublicUrl(filePath);
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.baseDir, filePath);
    await fs.unlink(fullPath);
  }

  async download(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.baseDir, filePath);
    return fs.readFile(fullPath);
  }
}
