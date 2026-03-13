import { jest } from '@jest/globals';
import 'async_hooks';

// Type definitions for mocks
interface MockAxiosResponse {
  data: Record<string, unknown>;
}

interface MockQdrantResult {
  id: string;
  score: number;
  payload: Record<string, unknown>;
}

interface MockLLMConfig {
  provider: string;
  chatModel: string;
  embeddingModel: string;
  baseUrl: string;
  apiKey: string | null;
  capabilities: { chat: boolean; embeddings: boolean };
}

jest.mock('axios');
const mockedAxios = {
  get: jest.fn<() => Promise<MockAxiosResponse>>(),
  post: jest.fn<() => Promise<MockAxiosResponse>>().mockResolvedValue({
    data: {
      message: { content: 'Mocked AI response content' },
      choices: [{ message: { content: 'Mocked AI response content' } }],
      embedding: new Array(384).fill(0),
      data: [{ embedding: new Array(384).fill(0) }],
    },
  }),
  patch: jest.fn<() => Promise<MockAxiosResponse>>(),
  delete: jest.fn<() => Promise<MockAxiosResponse>>(),
  put: jest.fn<() => Promise<MockAxiosResponse>>(),
};
jest.mock('axios', () => mockedAxios);

const createMockStream = (chunks: string[]) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });

global.fetch = jest.fn(
  async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const requestBody =
      typeof init?.body === 'string'
        ? init.body
        : input instanceof Request
          ? await input.text()
          : '';
    const streaming = requestBody.includes('"stream":true');

    if (url.includes('/api/chat')) {
      if (streaming) {
        return {
          ok: true,
          status: 200,
          body: createMockStream([
            JSON.stringify({
              message: { content: 'Mocked AI response content' },
              done: true,
            }) + '\n',
          ]),
          json: async () => ({
            message: { content: 'Mocked AI response content' },
          }),
        } as Response;
      }

      return {
        ok: true,
        status: 200,
        body: null,
        json: async () => ({
          message: { content: 'Mocked AI response content' },
        }),
      } as Response;
    }

    if (url.includes('/chat/completions')) {
      if (streaming) {
        return {
          ok: true,
          status: 200,
          body: createMockStream([
            'data: {"choices":[{"delta":{"content":"Mocked AI response content"}}]}\n',
            'data: [DONE]\n',
          ]),
          json: async () => ({
            choices: [{ message: { content: 'Mocked AI response content' } }],
          }),
        } as Response;
      }

      return {
        ok: true,
        status: 200,
        body: null,
        json: async () => ({
          choices: [{ message: { content: 'Mocked AI response content' } }],
        }),
      } as Response;
    }

    throw new Error(`Unhandled fetch mock for ${url}`);
  },
) as typeof fetch;

jest.mock('@repo/ai', () => ({
  QdrantWrapper: jest.fn().mockImplementation(() => ({
    ensureCollection: jest.fn<() => Promise<void>>().mockResolvedValue(),
    ensurePayloadIndexes: jest.fn<() => Promise<void>>().mockResolvedValue(),
    upsertPoints: jest.fn<() => Promise<void>>().mockResolvedValue(),
    searchSimilar: jest
      .fn<() => Promise<MockQdrantResult[]>>()
      .mockResolvedValue([
        {
          id: 'mock-id',
          score: 0.9,
          payload: {
            documentId: '65f1a2b3c4d5e6f7a8b9c0d2',
            userId: '65f1a2b3c4d5e6f7a8b9c0d1',
            chunkIndex: 0,
          },
        },
      ]),
  })),
  ProviderFactory: {
    getLLMConfig: jest.fn<() => Promise<MockLLMConfig>>().mockResolvedValue({
      provider: 'ollama',
      chatModel: 'llama3',
      embeddingModel: 'nomic-embed-text',
      baseUrl: 'http://localhost:11434',
      apiKey: null,
      capabilities: { chat: true, embeddings: true },
    }),
  },
  embeddingAdapter: {
    embedText: jest
      .fn<() => Promise<number[]>>()
      .mockResolvedValue(Array.from({ length: 384 }, () => 0)),
    embedBatch: jest
      .fn<() => Promise<number[][]>>()
      .mockResolvedValue([Array.from({ length: 384 }, () => 0)]),
  },
  EmbeddingAdapter: jest.fn().mockImplementation(() => ({
    embedText: jest
      .fn<() => Promise<number[]>>()
      .mockResolvedValue(Array.from({ length: 384 }, () => 0)),
  })),
  YouTubeExtractor: jest.fn().mockImplementation(() => ({})),
  UrlExtractor: jest.fn().mockImplementation(() => ({})),
  PdfExtractor: jest.fn().mockImplementation(() => ({})),
  ImageExtractor: jest.fn().mockImplementation(() => ({})),
  summarizePipeline: jest.fn(),
  chunkPipeline: jest.fn(),
}));

jest.mock('@upstash/qstash', () => ({
  Client: jest.fn().mockImplementation(() => ({
    publishJSON: jest
      .fn<(...args: unknown[]) => Promise<{ messageId: string }>>()
      .mockResolvedValue({ messageId: 'mock-message-id' }),
    publish: jest
      .fn<(...args: unknown[]) => Promise<{ messageId: string }>>()
      .mockResolvedValue({ messageId: 'mock-message-id' }),
  })),
  Receiver: jest.fn().mockImplementation(() => ({
    verify: jest
      .fn<(...args: unknown[]) => Promise<boolean>>()
      .mockResolvedValue(true),
  })),
}));

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue('mock-value'),
    set: jest.fn<(...args: unknown[]) => Promise<string>>().mockResolvedValue('OK'),
    del: jest.fn<(...args: unknown[]) => Promise<number>>().mockResolvedValue(1),
    exists: jest.fn<(...args: unknown[]) => Promise<number>>().mockResolvedValue(1),
    expire: jest.fn<(...args: unknown[]) => Promise<number>>().mockResolvedValue(1),
  })),
}));

