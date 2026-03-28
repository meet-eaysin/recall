import type { Readable } from 'stream';

export interface SmartAddDocumentCommand {
  userId: string;
  source?: string;
  buffer?: Buffer;
  stream?: Readable;
  originalName?: string;
  mimeType?: string;
  title?: string;
  description?: string;
  folderIds?: string[];
  tagIds?: string[];
  notes?: string;
}
