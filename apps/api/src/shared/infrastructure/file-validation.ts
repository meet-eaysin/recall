import { BadRequestException } from '@nestjs/common';

export type FileType = 'pdf' | 'image' | 'text' | 'docx';

export function validateFileType(
  buffer: Buffer,
  declaredMime: string,
): FileType {
  const hex = buffer.toString('hex', 0, 4).toLowerCase();

  // PDF magic bytes: %PDF
  if (hex === '25504446') {
    return 'pdf';
  }

  // Word (.docx) magic bytes: PK.. (ZIP format)
  // hex: 50 4b 03 04
  if (
    hex === '504b0304' &&
    (declaredMime.includes('officedocument.wordprocessingml') ||
      declaredMime ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
  ) {
    return 'docx';
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
    declaredMime === 'application/javascript' ||
    declaredMime === 'application/x-markdown' ||
    declaredMime === 'text/markdown'
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
