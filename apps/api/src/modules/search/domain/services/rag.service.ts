import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  AskResultDto,
  SourceRefDto,
} from '../../interface/schemas/search.schema';
import { QdrantWrapper, embeddingAdapter, ResolvedLLMConfig } from '@repo/ai';
import { env } from '../../../../shared/utils/env';
import { DocumentChunkModel, DocumentModel, IDocument } from '@repo/db';
import { Types } from 'mongoose';

interface QdrantPayload {
  documentId: string;
  userId: string;
  chunkIndex: number;
  [key: string]: unknown;
}

import { isObject } from '../../../../shared/utils/type-guards.util';

function isQdrantPayload(payload: unknown): payload is QdrantPayload {
  if (!isObject(payload)) return false;
  return (
    'documentId' in payload && 'userId' in payload && 'chunkIndex' in payload
  );
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private qdrant: QdrantWrapper;

  constructor() {
    this.qdrant = new QdrantWrapper(env.QDRANT_URL, env.QDRANT_API_KEY);
  }

  private transformUserId(userId: string): string {
    if (/^[0-9a-fA-F]{24}$/.test(userId)) {
      return userId;
    }
    const hex = Buffer.from(userId).toString('hex');
    return hex.padEnd(24, '0').slice(0, 24);
  }

  async ask(
    userId: string,
    question: string,
    llmConfig: ResolvedLLMConfig,
    documentIds?: string[],
    history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  ): Promise<AskResultDto> {
    const preparation = await this.prepareContext(
      userId,
      question,
      llmConfig,
      documentIds,
    );

    const answer = await this.complete(
      llmConfig,
      this.buildMessages(question, preparation.contextStr, history),
    );

    return {
      conversationId: '',
      answer,
      sources: preparation.sources,
      tokensUsed: preparation.tokensUsed,
    };
  }

  async stream(
    userId: string,
    question: string,
    llmConfig: ResolvedLLMConfig,
    handlers: {
      onComplete: (
        result: Omit<AskResultDto, 'conversationId'>,
      ) => Promise<void>;
      onError?: (message: string) => Promise<void> | void;
      onToken: (chunk: string) => Promise<void> | void;
    },
    documentIds?: string[],
    history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  ): Promise<void> {
    const preparation = await this.prepareContext(
      userId,
      question,
      llmConfig,
      documentIds,
    );

    const messages = this.buildMessages(
      question,
      preparation.contextStr,
      history,
    );
    let answer = '';

    try {
      if (llmConfig.provider === 'ollama') {
        const response = await fetch(`${llmConfig.baseUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: llmConfig.chatModel,
            messages,
            stream: true,
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error(`Ollama streaming failed with ${response.status}`);
        }

        for await (const line of this.readLines(response.body)) {
          if (!line.trim()) continue;
          const payload = JSON.parse(line) as {
            done?: boolean;
            message?: { content?: string };
          };
          const chunk = payload.message?.content;
          if (typeof chunk === 'string' && chunk.length > 0) {
            answer += chunk;
            await handlers.onToken(chunk);
          }
          if (payload.done) break;
        }
      } else {
        const response = await fetch(
          `${llmConfig.baseUrl || 'https://api.openai.com/v1'}/chat/completions`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${llmConfig.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: llmConfig.chatModel,
              messages,
              stream: true,
            }),
          },
        );

        if (!response.ok || !response.body) {
          throw new Error(`OpenAI streaming failed with ${response.status}`);
        }

        for await (const line of this.readLines(response.body)) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') break;

          const payload = JSON.parse(data) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const chunk = payload.choices?.[0]?.delta?.content;
          if (typeof chunk === 'string' && chunk.length > 0) {
            answer += chunk;
            await handlers.onToken(chunk);
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`LLM streaming failed: ${message}`);
      if (handlers.onError) {
        await handlers.onError('LLM service is currently unavailable');
      }
      throw new ServiceUnavailableException(
        'LLM service is currently unavailable',
      );
    }

    await handlers.onComplete({
      answer,
      sources: preparation.sources,
      tokensUsed: preparation.tokensUsed,
    });
  }

  private async prepareContext(
    userId: string,
    question: string,
    llmConfig: ResolvedLLMConfig,
    documentIds?: string[],
  ): Promise<{
    contextStr: string;
    sources: SourceRefDto[];
    tokensUsed: number;
  }> {
    const internalUserId = this.transformUserId(userId);

    const embeddedDocsCount = await DocumentModel.countDocuments({
      userId: internalUserId,
      embeddingsReady: true,
      ...(documentIds && documentIds.length > 0
        ? { _id: { $in: documentIds.map((id) => new Types.ObjectId(id)) } }
        : {}),
    }).exec();

    if (embeddedDocsCount === 0) {
      this.logger.warn(`No indexed documents found for user ${internalUserId}`);
      return {
        contextStr: '',
        sources: [],
        tokensUsed: 0,
      };
    }

    const queryVector = await embeddingAdapter.embedText(question, llmConfig);
    await this.qdrant.ensurePayloadIndexes('mindstack');

    const filterMust: Record<string, unknown>[] = [
      { key: 'userId', match: { value: internalUserId } },
    ];

    if (documentIds && documentIds.length > 0) {
      filterMust.push({
        key: 'documentId',
        match: { any: documentIds },
      });
    }

    const qdrantResults = await this.qdrant.searchSimilar(
      'mindstack',
      queryVector,
      { must: filterMust },
      8,
    );

    const highestScore =
      qdrantResults.length > 0 ? (qdrantResults[0]?.score ?? 0) : 0;
    if (highestScore < 0.35) {
      return {
        contextStr: '',
        sources: [],
        tokensUsed: 0,
      };
    }

    const docChunkCounts = new Map<string, number>();
    const selectedChunks: {
      documentId: string;
      chunkIndex: number;
      score: number;
    }[] = [];

    for (const result of qdrantResults) {
      const payload = result.payload;
      if (
        !isQdrantPayload(payload) ||
        result.score === undefined ||
        result.score < 0.35
      )
        continue;

      const docId = payload.documentId;
      const count = docChunkCounts.get(docId) ?? 0;

      if (count < 2) {
        docChunkCounts.set(docId, count + 1);
        selectedChunks.push({
          documentId: docId,
          chunkIndex: payload.chunkIndex,
          score: result.score,
        });
      }
    }

    if (selectedChunks.length === 0) {
      return {
        contextStr: '',
        sources: [],
        tokensUsed: 0,
      };
    }

    const uniqueDocIds = Array.from(
      new Set(selectedChunks.map((c) => c.documentId)),
    );
    const docs = await DocumentModel.find({
      _id: { $in: uniqueDocIds.map((id) => new Types.ObjectId(id)) },
    })
      .select('title author createdAt sourceType sourceUrl metadata')
      .lean<IDocument[]>()
      .exec();

    const docMap = new Map(docs.map((d) => [d._id.toString(), d]));

    const chunkDataArray = await Promise.all(
      selectedChunks.map(async (chunk) => {
        const chunkDoc = await DocumentChunkModel.findOne({
          documentId: new Types.ObjectId(chunk.documentId),
          index: chunk.chunkIndex,
        })
          .lean()
          .exec();

        return {
          ...chunk,
          content: chunkDoc?.content ?? '',
        };
      }),
    );

    const validChunks = chunkDataArray
      .filter((c) => c.content.length > 0)
      .sort((a, b) => b.score - a.score);

    let contextStr = '';
    let estimatedTokens = 0;
    const sourcesMap = new Map<string, SourceRefDto>();

    for (const chunk of validChunks) {
      const doc = docMap.get(chunk.documentId);
      if (!doc) continue;

      const title = doc.title || 'Untitled Document';

      const authorRaw = doc.metadata?.author;
      const author = typeof authorRaw === 'string' ? authorRaw : null;

      const date =
        doc.createdAt instanceof Date
          ? doc.createdAt.toISOString().split('T')[0]
          : null;

      const originalSource =
        typeof doc.sourceUrl === 'string' ? doc.sourceUrl : null;

      if (!sourcesMap.has(chunk.documentId)) {
        sourcesMap.set(chunk.documentId, {
          documentId: chunk.documentId,
          title,
          author: author ?? null,
          publishedAt: date ?? null,
          originalSource: originalSource ?? null,
        });
      }

      const chunkText = `[Source: ${title}${author ? ` by ${author}` : ''} (${date || 'Unknown date'})]\n${chunk.content}\n---\n`;
      const chunkTokens = Math.ceil(chunkText.length / 4);

      if (estimatedTokens + chunkTokens > 6000) {
        break;
      }

      contextStr += chunkText;
      estimatedTokens += chunkTokens;
    }

    return {
      contextStr,
      sources: Array.from(sourcesMap.values()),
      tokensUsed: estimatedTokens,
    };
  }

  private buildMessages(
    question: string,
    contextStr: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const systemPrompt = `You are a helpful AI assistant. Answer the user's question ONLY using the provided context. If the context does not contain the answer, say "I cannot answer this based on the provided documents." clearly. Always cite which document your answer comes from using the [Source: Title] format. Prefer clear markdown with headings, short paragraphs, and bullet lists when useful.`;

    const historyMessages = history.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const userPrompt =
      contextStr.trim().length > 0
        ? `Context:\n${contextStr}\n\nQuestion: ${question}`
        : `Context:\nNo relevant context was retrieved.\n\nQuestion: ${question}`;

    return [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: userPrompt },
    ];
  }

  private async complete(
    llmConfig: ResolvedLLMConfig,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  ): Promise<string> {
    try {
      if (llmConfig.provider === 'ollama') {
        const response = await fetch(`${llmConfig.baseUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: llmConfig.chatModel,
            messages,
            stream: false,
          }),
        });
        const payload = (await response.json()) as {
          message?: { content?: string };
        };
        const content = payload.message?.content;
        if (typeof content === 'string') {
          return content;
        }
        throw new Error('Invalid response from Ollama endpoint');
      }

      const response = await fetch(
        `${llmConfig.baseUrl || 'https://api.openai.com/v1'}/chat/completions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${llmConfig.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: llmConfig.chatModel,
            messages,
          }),
        },
      );
      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = payload.choices?.[0]?.message?.content;
      if (typeof content === 'string') {
        return content;
      }
      throw new Error('Invalid response from OpenAI endpoint');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`LLM call failed: ${message}`);
      throw new ServiceUnavailableException(
        'LLM service is currently unavailable',
      );
    }
  }

  private async *readLines(stream: ReadableStream<Uint8Array>) {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        yield part;
      }
    }

    buffer += decoder.decode();
    if (buffer.trim()) {
      yield buffer;
    }
  }
}
