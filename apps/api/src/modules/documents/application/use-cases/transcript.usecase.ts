import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DocumentType, QUEUE_TRANSCRIPT } from '@repo/types';
import { QStashService } from '@repo/queue';
import { IDocumentRepository } from '../../domain/repositories/document.repository';
import { ITranscriptRepository } from '../../domain/repositories/transcript.repository';

@Injectable()
export class TranscriptUseCase {
  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly transcriptRepository: ITranscriptRepository,
    private readonly qstashService: QStashService,
  ) {}

  async getTranscript(documentId: string, userId: string) {
    const doc = await this.documentRepository.findById(documentId, userId);
    if (!doc) throw new NotFoundException('Document not found');

    if (doc.type !== DocumentType.YOUTUBE) {
      throw new BadRequestException(
        'Transcripts are only available for YouTube documents',
      );
    }

    const transcript =
      await this.transcriptRepository.findByDocumentId(documentId);

    if (!transcript) {
      return { available: false, segments: [], fullText: '' };
    }

    return {
      available: true,
      segments: transcript.segments,
      fullText: transcript.content,
    };
  }

  async generateTranscript(documentId: string, userId: string) {
    const doc = await this.documentRepository.findById(documentId, userId);
    if (!doc) throw new NotFoundException('Document not found');

    if (doc.type !== DocumentType.YOUTUBE) {
      throw new BadRequestException(
        'Transcripts are only available for YouTube documents',
      );
    }

    const transcript =
      await this.transcriptRepository.findByDocumentId(documentId);

    if (transcript) {
      return {
        alreadyExists: true,
        transcript: {
          segments: transcript.segments,
          fullText: transcript.content,
        },
      };
    }

    await this.qstashService.publishMessage(QUEUE_TRANSCRIPT, { documentId, userId });
    return { alreadyExists: false };
  }
}
