import { Injectable } from '@nestjs/common';
import fs from 'node:fs/promises';
import path from 'node:path';

@Injectable()
export class LocalStorage {
  private baseDir!: string;

  constructor(baseDir?: string) {
    if (baseDir) {
      this.baseDir = path.resolve(baseDir);
    }
  }

  /**
   * Initialize the base directory. Useful for NestJS providers where injections happen later.
   */
  public setBaseDir(baseDir: string): void {
    this.baseDir = path.resolve(baseDir);
  }

  public async saveFile(
    buffer: Buffer,
    originalName: string,
    userId: string,
  ): Promise<string> {
    if (!this.baseDir) throw new Error('LocalStorage baseDir not initialized');
    const userDir = path.join(this.baseDir, userId);
    await fs.mkdir(userDir, { recursive: true });

    const fileName = `${Date.now()}-${originalName}`;
    const filePath = path.join(userDir, fileName);

    await fs.writeFile(filePath, buffer);

    return path.relative(this.baseDir, filePath);
  }

  public async getFile(relativeFilePath: string): Promise<Buffer> {
    if (!this.baseDir) throw new Error('LocalStorage baseDir not initialized');
    const filePath = path.join(this.baseDir, relativeFilePath);
    return fs.readFile(filePath);
  }

  public async deleteFile(relativeFilePath: string): Promise<void> {
    if (!this.baseDir) throw new Error('LocalStorage baseDir not initialized');
    const filePath = path.join(this.baseDir, relativeFilePath);
    await fs.unlink(filePath);
  }
}
