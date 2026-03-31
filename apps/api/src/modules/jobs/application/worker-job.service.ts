import { Injectable, Logger } from '@nestjs/common';
import {
  chunkText,
  docxExtractor,
  embeddingAdapter,
  imageExtractor,
  LLMClientFactory,
  pdfExtractor,
  QdrantWrapper,
  type ResolvedClient,
  summarizePipeline,
  urlExtractor,
  youtubeExtractor,
} from '@repo/ai';
import { decrypt } from '@repo/crypto';
import { QueueService } from '@repo/queue';
import { IStorageProvider } from '@repo/storage';
import {
  DocumentType,
  IngestionStage,
  IngestionStatus,
  NotionAction,
  QUEUE_GRAPH,
  QUEUE_NOTION_SYNC,
  SourceType,
  TranscriptStatus,
  type GraphJobData,
  type IngestionJobData,
  type NotionSyncJobData,
  type SummaryJobData,
  type TranscriptJobData,
} from '@repo/types';
import * as crypto from 'node:crypto';
import { env } from '../../../shared/utils/env';
import { hasBooleanProperty } from '../../../shared/utils/type-guards.util';
import { InvalidOperationDomainException } from '../../../shared/errors/invalid-operation.exception';
import { NotFoundDomainException } from '../../../shared/errors/not-found.exception';
import { IDocumentRepository } from '../../documents/domain/repositories/document.repository';
import { ITranscriptRepository } from '../../documents/domain/repositories/transcript.repository';
import { GraphBuilderService } from '../../graph/domain/services/graph-builder.service';
import { IIngestionJobRepository } from '../../ingestion/domain/repositories/ingestion-job.repository';
import { ITagRepository } from '../../knowledge/domain/repositories/tag.repository';
import { INotionConfigRepository } from '../../notion/domain/repositories/notion-config.repository';
import { NotionClient } from '../../notion/infrastructure/notion-client';

@Injectable()
export class WorkerJobService {
  private readonly logger = new Logger(WorkerJobService.name);
  private readonly qdrant = new QdrantWrapper(
    env.QDRANT_URL,
    env.QDRANT_API_KEY,
  );

  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly transcriptRepository: ITranscriptRepository,
    private readonly ingestionJobRepository: IIngestionJobRepository,
    private readonly tagRepository: ITagRepository,
    private readonly notionConfigRepository: INotionConfigRepository,
    private readonly notionClient: NotionClient,
    private readonly graphBuilderService: GraphBuilderService,
    private readonly storageProvider: IStorageProvider,
    private readonly queueService: QueueService,
    private readonly llmClientFactory: LLMClientFactory,
  ) {}

  async processGraphJob(data: GraphJobData): Promise<void> {
    await this.graphBuilderService.buildRelationships(
      data.documentId,
      data.userId,
    );
  }

  async processSummaryJob(data: SummaryJobData): Promise<void> {
    const doc = await this.documentRepository.findById(
      data.documentId,
      data.userId,
    );
    if (!doc) throw new NotFoundDomainException('Document not found');

    let textForSummary = '';

    if (doc.type === DocumentType.YOUTUBE) {
      const transcript = await this.transcriptRepository.findByDocumentId(
        doc.id,
      );
      if (transcript) {
        textForSummary = transcript.content;
      }
    } else {
      const chunks = await this.documentRepository.listChunks(doc.id);
      textForSummary = chunks.map((chunk) => chunk.content).join('\n\n');
      if (!textForSummary && doc.content) {
        textForSummary = doc.content;
      }
    }

    if (!textForSummary.trim()) {
      throw new InvalidOperationDomainException(
        'Document has no extractable text for summarization',
      );
    }

    const resolvedClient = await this.llmClientFactory.createForUserId(
      data.userId,
    );
    const summary = await summarizePipeline.generateSummary(
      textForSummary,
      doc.type,
      resolvedClient,
    );

    await this.documentRepository.update(doc.id, data.userId, { summary });
  }

  async processTranscriptJob(data: TranscriptJobData): Promise<void> {
    const doc = await this.documentRepository.findById(
      data.documentId,
      data.userId,
    );
    if (!doc) throw new NotFoundDomainException('Document not found');
    if (doc.type !== DocumentType.YOUTUBE) return;
    if (!doc.sourceUrl) {
      throw new InvalidOperationDomainException(
        'No sourceUrl found for transcript generation',
      );
    }

    const existingTranscript = await this.transcriptRepository.findByDocumentId(
      doc.id,
    );
    if (existingTranscript) return;

    let transcriptStatus = TranscriptStatus.COMPLETED;
    let transcriptError: string | undefined;
    let transcriptSegments: Array<{
      start: number;
      end: number;
      text: string;
    }> = [];
    let fullText = '';

    try {
      const extracted = await youtubeExtractor.extractYouTube(doc.sourceUrl);
      fullText = extracted.fullText || '';
      transcriptSegments = extracted.transcript.map((segment) => ({
        start: segment.start,
        end: segment.start + segment.duration,
        text: segment.text,
      }));
      if (transcriptSegments.length === 0) {
        transcriptStatus = TranscriptStatus.UNAVAILABLE;
        transcriptError =
          'No transcript available for this video (disabled or not provided).';
      }
    } catch (error) {
      transcriptStatus = TranscriptStatus.FAILED;
      transcriptError =
        error instanceof Error ? error.message : 'Unknown error';
    }

    if (
      transcriptStatus === TranscriptStatus.COMPLETED &&
      transcriptSegments.length > 0
    ) {
      await this.transcriptRepository.save(doc.id, {
        content: fullText,
        segments: transcriptSegments.map((segment) => ({
          text: segment.text,
          start: segment.start,
          duration: segment.end - segment.start,
        })),
      });
    }

    const chunks = chunkText(fullText);
    const resolvedConfig = await this.llmClientFactory.resolveConfigForUserId(
      data.userId,
    );

    for (const chunk of chunks) {
      const vector = await embeddingAdapter.embedText(
        String(chunk.content),
        resolvedConfig,
      );

      await this.qdrant.upsertPoints('mindstack', [
        {
          id: `${doc.id}-${chunk.index}`,
          vector,
          payload: {
            documentId: doc.id,
            userId: data.userId,
            chunkIndex: chunk.index,
            text: chunk.content,
            type: doc.type,
            status: doc.status,
          },
        },
      ]);
    }

    await this.documentRepository.replaceChunks(
      doc.id,
      this.toInternalUserId(data.userId),
      chunks.map((chunk) => ({
        content: chunk.content,
        index: chunk.index,
        tokenCount: chunk.tokenCount,
        metadata: {
          chunkIndex: chunk.index,
          heading: chunk.headingContext,
        },
        createdAt: new Date(),
      })),
    );

    await this.documentRepository.update(doc.id, data.userId, {
      embeddingsReady: transcriptStatus === TranscriptStatus.COMPLETED,
      chunkCount: chunks.length,
      transcriptStatus,
      transcriptError,
    });
  }

  async processNotionSyncJob(data: NotionSyncJobData): Promise<void> {
    const config = await this.notionConfigRepository.findByUserId(data.userId);
    if (
      !config ||
      !config.accessToken ||
      !config.props.syncEnabled ||
      !config.props.targetDatabaseId
    ) {
      return;
    }

    const token = decrypt(config.accessToken, env.ENCRYPTION_KEY);
    if (typeof token !== 'string') {
      throw new InvalidOperationDomainException('Invalid Notion token');
    }

    const doc = await this.documentRepository.findById(
      data.documentId,
      data.userId,
    );
    if (!doc && data.action !== NotionAction.DELETE) {
      return;
    }

    const targetDatabaseId = config.props.targetDatabaseId;
    if (!targetDatabaseId) return;

    if (data.action === NotionAction.CREATE && doc) {
      const pageId = await this.notionClient.createPage(
        token,
        targetDatabaseId,
        {
          title: doc.title,
          content: doc.props.summary || doc.content || undefined,
          url: doc.sourceUrl || undefined,
        },
      );
      await this.documentRepository.update(doc.id, data.userId, {
        metadata: { ...doc.props.metadata, notionPageId: pageId },
      });
      return;
    }

    if (data.action === NotionAction.UPDATE && doc) {
      const pageId = doc.props.metadata?.notionPageId;
      if (typeof pageId !== 'string') return;
      await this.notionClient.updatePage(token, pageId, {
        title: doc.title,
        content: doc.props.summary || doc.content || undefined,
        url: doc.sourceUrl || undefined,
      });
      return;
    }

    if (data.action === NotionAction.DELETE && doc) {
      const pageId = doc.props.metadata?.notionPageId;
      if (typeof pageId !== 'string') return;
      await this.notionClient.deletePage(token, pageId);
      await this.documentRepository.update(doc.id, data.userId, {
        metadata: {
          ...doc.props.metadata,
          notionPageId: undefined,
        },
      });
    }
  }

  async processIngestionJob(data: IngestionJobData): Promise<void> {
    const { documentId, userId } = data;
    const doc = await this.documentRepository.findById(documentId, userId);
    if (!doc) throw new NotFoundDomainException('Document not found');

    await this.ingestionJobRepository.updateStage(
      documentId,
      IngestionStage.START,
      IngestionStatus.PROCESSING,
      userId,
    );
    await this.documentRepository.update(documentId, userId, {
      ingestionStatus: IngestionStatus.PROCESSING,
    });

    const text = await this.extractDocumentText(doc, userId);
    if (text.length < 50) {
      await this.documentRepository.update(documentId, userId, {
        ingestionStatus: IngestionStatus.COMPLETED,
        embeddingsReady: false,
      });
      await this.ingestionJobRepository.updateStage(
        documentId,
        IngestionStage.DONE,
        IngestionStatus.COMPLETED,
        userId,
      );
      return;
    }

    await this.ingestionJobRepository.updateStage(
      documentId,
      IngestionStage.CLASSIFY,
      IngestionStatus.PROCESSING,
      userId,
    );

    const llmConfig =
      await this.llmClientFactory.resolveConfigForUserId(userId);
    const llmClient = await this.llmClientFactory.createForUserId(userId);
    await this.enrichDocumentIfNeeded(
      doc.id,
      userId,
      text,
      doc.props.metadata,
      llmClient,
    );
    await this.classifyAndAttachTags(doc.id, userId, text, llmClient);

    await this.ingestionJobRepository.updateStage(
      documentId,
      IngestionStage.CHUNK,
      IngestionStatus.PROCESSING,
      userId,
    );

    const chunks = chunkText(text);
    await this.documentRepository.replaceChunks(
      documentId,
      this.toInternalUserId(userId),
      chunks.map((chunk) => ({
        content: chunk.content,
        index: chunk.index,
        tokenCount: chunk.tokenCount,
        metadata: {
          chunkIndex: chunk.index,
          heading: chunk.headingContext,
        },
        createdAt: new Date(),
      })),
    );

    await this.ingestionJobRepository.updateStage(
      documentId,
      IngestionStage.EMBED,
      IngestionStatus.PROCESSING,
      userId,
    );
    await this.qdrant.ensureCollection('mindstack', 768);
    const embeddings = await embeddingAdapter.embedBatch(
      chunks.map((chunk) => String(chunk.content)),
      llmConfig,
    );
    const points = chunks
      .map((chunk, index) => {
        const vector = embeddings[index];
        if (!vector) return null;
        const hash = crypto
          .createHash('md5')
          .update(`${documentId}-${chunk.index}`)
          .digest('hex');
        return {
          id: `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`,
          vector,
          payload: {
            documentId,
            userId,
            chunkIndex: chunk.index,
          },
        };
      })
      .filter((point): point is NonNullable<typeof point> => point !== null);

    if (points.length > 0) {
      await this.qdrant.deleteByFilter('mindstack', {
        must: [{ key: 'documentId', match: { value: documentId } }],
      });
      await this.qdrant.upsertPoints('mindstack', points);
    }

    await this.ingestionJobRepository.updateStage(
      documentId,
      IngestionStage.GRAPH,
      IngestionStatus.PROCESSING,
      userId,
    );
    await this.queueService.publishMessage(QUEUE_GRAPH, { documentId, userId });
    await this.documentRepository.update(documentId, userId, {
      ingestionStatus: IngestionStatus.COMPLETED,
      embeddingsReady: true,
      chunkCount: chunks.length,
      content: text.substring(0, 10000),
    });
    await this.ingestionJobRepository.updateStage(
      documentId,
      IngestionStage.DONE,
      IngestionStatus.COMPLETED,
      userId,
    );
    await this.queueService.publishMessage(QUEUE_NOTION_SYNC, {
      documentId,
      userId,
      action: NotionAction.CREATE,
    });
  }

  private async extractDocumentText(
    doc: Awaited<ReturnType<IDocumentRepository['findById']>> extends infer T
      ? Exclude<T, null>
      : never,
    userId: string,
  ): Promise<string> {
    const source = doc.sourceUrl || '';

    if (doc.type === DocumentType.PDF) {
      const buffer = await this.storageProvider.download(source);
      const result = await pdfExtractor.extractPdf(buffer);
      await this.documentRepository.update(doc.id, userId, {
        ocrConfidence: result.ocrConfidence,
      });
      return result.text;
    }

    if (doc.type === DocumentType.DOCX) {
      const buffer = await this.storageProvider.download(source);
      const result = await docxExtractor.extractDocx(buffer);
      return result.text;
    }

    if (doc.type === DocumentType.URL) {
      const result = await urlExtractor.extractFromUrl(source);
      const updateData: Record<string, unknown> = {
        renderedMarkdown: result.markdown,
      };
      if (result.title && result.title !== 'Untitled') {
        updateData.title = result.title;
      }
      await this.documentRepository.update(doc.id, userId, updateData);
      return result.markdown;
    }

    if (doc.type === DocumentType.YOUTUBE) {
      let transcriptStatus = TranscriptStatus.COMPLETED;
      let transcriptError: string | undefined;
      let fullText = '';
      let transcript: Array<{ text: string; start: number; duration: number }> =
        [];

      try {
        const extracted = await youtubeExtractor.extractYouTube(source);
        fullText = extracted.fullText || '';
        transcript = extracted.transcript;
        if (transcript.length === 0) {
          transcriptStatus = TranscriptStatus.UNAVAILABLE;
          transcriptError =
            'No transcript available for this video (disabled or not provided).';
        }
      } catch (error) {
        transcriptStatus = TranscriptStatus.FAILED;
        transcriptError =
          error instanceof Error ? error.message : 'Unknown error';
      }

      if (
        transcriptStatus === TranscriptStatus.COMPLETED &&
        transcript.length > 0
      ) {
        await this.transcriptRepository.save(doc.id, {
          content: fullText,
          segments: transcript.map((segment) => ({
            text: segment.text,
            start: segment.start,
            duration: segment.duration,
          })),
        });
      }

      const updateData: Record<string, unknown> = {
        transcriptStatus,
        transcriptError,
      };
      await this.documentRepository.update(doc.id, userId, updateData);
      return fullText;
    }

    if (doc.type === DocumentType.IMAGE) {
      const buffer = await this.storageProvider.download(source);
      const result = await imageExtractor.extractImage(buffer);
      await this.documentRepository.update(doc.id, userId, {
        ocrConfidence: result.ocrConfidence,
      });
      return result.text;
    }

    if (doc.type === DocumentType.TEXT) {
      if (doc.props.sourceType === SourceType.FILE) {
        const buffer = await this.storageProvider.download(source);
        return buffer.toString('utf-8');
      }
      return source;
    }

    return '';
  }

  private async classifyAndAttachTags(
    documentId: string,
    userId: string,
    text: string,
    client: ResolvedClient,
  ): Promise<void> {
    const topics = await this.classifyTopics(text.substring(0, 5000), client);
    if (topics.length === 0) return;

    const doc = await this.documentRepository.findById(documentId, userId);
    if (!doc) return;

    const existingTags = new Set(doc.props.tags);
    for (const topic of topics) {
      const normalized = topic.toLowerCase();
      const existing = await this.tagRepository.findByName(normalized, userId);
      if (!existing) {
        await this.tagRepository.create({
          userId,
          name: normalized,
          source: 'ai',
          color: '#6366f1',
        });
      }
      existingTags.add(normalized);
    }

    await this.documentRepository.update(documentId, userId, {
      tags: Array.from(existingTags),
    });
  }

  private async enrichDocumentIfNeeded(
    documentId: string,
    userId: string,
    text: string,
    metadata: Record<string, unknown>,
    client: ResolvedClient,
  ): Promise<void> {
    const requiresEnrichment =
      hasBooleanProperty(metadata, 'requiresEnrichment') &&
      metadata.requiresEnrichment === true;
    if (!requiresEnrichment) return;

    const enrichment = await this.enrichDocument(
      text.substring(0, 8000),
      client,
    );
    const updatedMetadata: Record<string, unknown> = {
      ...metadata,
      requiresEnrichment: false,
    };
    const updateData: Record<string, unknown> = { metadata: updatedMetadata };

    if (
      hasBooleanProperty(metadata, 'requiresEnrichmentTitle') &&
      metadata.requiresEnrichmentTitle === true &&
      enrichment.title &&
      enrichment.title !== 'Untitled Document'
    ) {
      updateData.title = enrichment.title;
    }

    if (
      hasBooleanProperty(metadata, 'requiresEnrichmentDescription') &&
      metadata.requiresEnrichmentDescription === true &&
      enrichment.description
    ) {
      updatedMetadata.description = enrichment.description;
    }

    await this.documentRepository.update(documentId, userId, updateData);
  }

  private async classifyTopics(
    text: string,
    client: ResolvedClient,
  ): Promise<string[]> {
    try {
      const response = await client.complete({
        messages: [
          {
            role: 'user',
            content:
              'Extract 3-5 main topics from this text as a comma-separated list. Only return the list.\n\nText: ' +
              text,
          },
        ],
        temperature: 0.1,
      });
      return response
        .split(',')
        .map((item: string) => item.trim())
        .filter(Boolean);
    } catch (error) {
      this.logger.warn(
        `Failed to classify topics: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return [];
    }
  }

  private async enrichDocument(
    text: string,
    client: ResolvedClient,
  ): Promise<{ title?: string; description?: string }> {
    try {
      const response = await client.complete({
        messages: [
          {
            role: 'user',
            content:
              'Based on the following text, generate a concise title and a short 1-2 sentence description. Format your response exactly as JSON:\n{"title": "...", "description": "..."}\n\nText: ' +
              text.substring(0, 3000),
          },
        ],
        temperature: 0.3,
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch?.[0] ?? response) as {
        title?: unknown;
        description?: unknown;
      };

      return {
        title: typeof parsed.title === 'string' ? parsed.title : undefined,
        description:
          typeof parsed.description === 'string'
            ? parsed.description
            : undefined,
      };
    } catch (error) {
      this.logger.warn(
        `Document enrichment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return {};
    }
  }

  private toInternalUserId(userId: string): string {
    if (/^[0-9a-fA-F]{24}$/.test(userId)) {
      return userId;
    }

    const hex = Buffer.from(userId).toString('hex');
    return hex.padEnd(24, '0').slice(0, 24);
  }
}
