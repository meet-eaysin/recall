import type { CreateDocumentCommand } from './create-document';

export interface CreateUploadDocumentCommand extends Omit<
  CreateDocumentCommand,
  'type' | 'source'
> {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}
