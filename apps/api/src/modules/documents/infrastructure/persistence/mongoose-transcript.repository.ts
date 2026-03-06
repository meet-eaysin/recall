import { Injectable } from '@nestjs/common';
import { DocumentTranscriptModel } from '@repo/db';
import {
  ITranscriptRepository,
  DocumentTranscript,
} from '../../domain/repositories/transcript.repository';

@Injectable()
export class MongooseTranscriptRepository extends ITranscriptRepository {
  async findByDocumentId(
    documentId: string,
  ): Promise<DocumentTranscript | null> {
    const transcript = await DocumentTranscriptModel.findOne({
      documentId,
    }).exec();
    if (!transcript) return null;

    return {
      documentId: transcript.documentId.toString(),
      content: transcript.content,
      segments: transcript.segments.map((s) => ({
        text: s.text,
        start: s.start,
        duration: s.end - s.start,
      })),
    };
  }
}
