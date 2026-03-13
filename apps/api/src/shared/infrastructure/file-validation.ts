import { BadRequestException } from '@nestjs/common';


export type FileType = 'pdf' | 'image' | 'text';

export function validateFileType(
  buffer: Buffer,
  declaredMime: string,
): FileType {
  const hex = buffer.toString('hex', 0, 4).toLowerCase();

  // PDF magic bytes: %PDF
  if (hex === '25504446') {
    return 'pdf';
  }

  // Image magic bytes
  if (
    hex.startsWith('ffd8ff') || // JPEG
    hex.startsWith('89504e47') || // PNG
    hex.startsWith('52494646') // WEBP
  ) {
    return 'image';
  }

  // Text validation
  if (
    declaredMime.startsWith('text/') ||
    declaredMime === 'application/json' ||
    declaredMime === 'application/javascript'
  ) {
    // Basic check for text: no null bytes in the first 512 bytes
    const sample = buffer.slice(0, 512);
    for (let i = 0; i < sample.length; i++) {
      if (sample[i] === 0) {
        throw new BadRequestException('Binary data detected in text file');
      }
    }
    return 'text';
  }

  throw new BadRequestException(`Unsupported file type: ${declaredMime}`);
}
