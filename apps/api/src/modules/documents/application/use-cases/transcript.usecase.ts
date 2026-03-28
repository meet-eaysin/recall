import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DocumentType, QUEUE_TRANSCRIPT, TranscriptStatus } from '@repo/types';
import { QueueService } from '@repo/queue';
import { IDocumentRepository } from '../../domain/repositories/document.repository';
import { ITranscriptRepository } from '../../domain/repositories/transcript.repository';

@Injectable()
export class TranscriptUseCase {
  private readonly logger = new Logger(TranscriptUseCase.name);

  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly transcriptRepository: ITranscriptRepository,
    private readonly queueService: QueueService,
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

    const transcriptStatus = doc.transcriptStatus || 'idle';
    const transcriptError = doc.transcriptError;

    if (!transcript) {
      return {
        available: false,
        status: transcriptStatus,
        reason: transcriptError,
        segments: [],
        content: '',
      };
    }

    return {
      available: true,
      status: 'completed',
      segments: transcript.segments,
      content: transcript.content,
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
          content: transcript.content,
        },
      };
    }

    this.logger.log(
      `Generating transcript for document ${documentId}. Setting status to PENDING.`,
    );
    await this.documentRepository.update(documentId, userId, {
      transcriptStatus: TranscriptStatus.PENDING,
      transcriptError: undefined,
    });

    await this.queueService.publishMessage(QUEUE_TRANSCRIPT, {
      documentId,
      userId,
    });
    return { alreadyExists: false };
  }
}
