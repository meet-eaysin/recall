import type { DocumentStatus } from '@repo/types';

export interface UpdateDocumentCommand {
  id: string;
  userId: string;
  data: {
    status?: DocumentStatus | undefined;
    title?: string | undefined;
    folderId?: string | undefined;
    tagIds?: string[] | undefined;
    metadata?: Record<string, unknown> | undefined;
  };
}
