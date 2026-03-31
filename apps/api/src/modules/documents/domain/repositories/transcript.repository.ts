export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface DocumentTranscript {
  documentId: string;
  content: string;
  segments: TranscriptSegment[];
}

export abstract class ITranscriptRepository {
  abstract findByDocumentId(
    documentId: string,
  ): Promise<DocumentTranscript | null>;
  abstract save(
    documentId: string,
    transcript: Omit<DocumentTranscript, 'documentId'>,
  ): Promise<void>;
}
