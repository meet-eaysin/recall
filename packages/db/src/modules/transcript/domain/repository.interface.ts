import type { DocumentTranscript } from '@repo/types';

export abstract class ITranscriptRepository {
  abstract findByDocumentId(
    documentId: string,
  ): Promise<DocumentTranscript | null>;
}
