import { jest } from '@jest/globals';
import 'async_hooks';
import type { LLMConfig } from '@repo/types';
import type {
  ChatCompletionMessageParam,
  ResolvedClient,
  ResolvedLLMConfig,
} from '@repo/ai';

// Type definitions for mocks
type MockValue = string | number | boolean | null | object;
type MockArgs = Array<string | number | boolean | object | null>;

interface MockAxiosResponse {
  data: Record<string, MockValue>;
}

interface MockQdrantResult {
  id: string;
  score: number;
  payload: Record<string, MockValue>;
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

const createJsonResponse = (body: Record<string, MockValue>) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

const createStreamResponse = (chunks: string[]) =>
  new Response(createMockStream(chunks), {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  });

async function fetchMock(
  input: string | URL | Request,
  init?: RequestInit,
): Promise<Response> {
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
      return createStreamResponse([
        JSON.stringify({
          message: { content: 'Mocked AI response content' },
          done: true,
        }) + '\n',
      ]);
    }

    return createJsonResponse({
      message: { content: 'Mocked AI response content' },
    });
  }

  if (url.includes('/chat/completions')) {
    if (streaming) {
      return createStreamResponse([
        'data: {"choices":[{"delta":{"content":"Mocked AI response content"}}]}\n',
        'data: [DONE]\n',
      ]);
    }

    return createJsonResponse({
      choices: [{ message: { content: 'Mocked AI response content' } }],
    });
  }

  throw new Error(`Unhandled fetch mock for ${url}`);
}

global.fetch = fetchMock;

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
  LLMClientFactory: jest.fn().mockImplementation(() => ({
    resolveConfig: jest
      .fn<(config?: LLMConfig | null) => ResolvedLLMConfig>()
      .mockReturnValue({
        provider: 'ollama',
        chatModel: 'llama3',
        embeddingProvider: 'ollama',
        embeddingModel: 'nomic-embed-text',
        baseUrl: 'http://localhost:11434',
        embeddingBaseUrl: 'http://localhost:11434',
        apiKey: 'mock-api-key',
        embeddingApiKey: undefined,
        adapterKey: 'ollama',
        embeddingAdapterKey: 'ollama',
        allowDevFallback: false,
      }),
    createForUser: jest
      .fn<(config?: LLMConfig | null) => Promise<ResolvedClient>>()
      .mockImplementation(async () => {
        const mockComplete = jest
          .fn<
            (params: {
              messages: ChatCompletionMessageParam[];
              temperature?: number;
            }) => Promise<string>
          >()
          .mockResolvedValue('Mocked AI response content');
        const mockStream = jest
          .fn<
            (params: {
              messages: ChatCompletionMessageParam[];
              temperature?: number;
              onToken: (token: string) => void | Promise<void>;
            }) => Promise<string>
          >()
          .mockImplementation(async (params) => {
            if (params.onToken) {
              await params.onToken('Mocked ');
              await params.onToken('AI ');
              await params.onToken('response ');
              await params.onToken('content');
            }
            return 'Mocked AI response content';
          });

        const mockClient: ResolvedClient = {
          providerId: 'ollama',
          modelId: 'llama3',
          complete: mockComplete,
          stream: mockStream,
        };
        return mockClient;
      }),
    resolveConfigForUserId: jest
      .fn<(userId: string) => Promise<ResolvedLLMConfig>>()
      .mockResolvedValue({
        provider: 'ollama',
        chatModel: 'llama3',
        embeddingProvider: 'ollama',
        embeddingModel: 'nomic-embed-text',
        baseUrl: 'http://localhost:11434',
        embeddingBaseUrl: 'http://localhost:11434',
        apiKey: 'mock-api-key',
        embeddingApiKey: undefined,
        adapterKey: 'ollama',
        embeddingAdapterKey: 'ollama',
        allowDevFallback: false,
      }),
    createForUserId: jest
      .fn<(userId: string) => Promise<ResolvedClient>>()
      .mockImplementation(async () => {
        const mockComplete = jest
          .fn<
            (params: {
              messages: ChatCompletionMessageParam[];
              temperature?: number;
            }) => Promise<string>
          >()
          .mockResolvedValue('Mocked AI response content');
        const mockStream = jest
          .fn<
            (params: {
              messages: ChatCompletionMessageParam[];
              temperature?: number;
              onToken: (token: string) => void | Promise<void>;
            }) => Promise<string>
          >()
          .mockImplementation(async (params) => {
            if (params.onToken) {
              await params.onToken('Mocked ');
              await params.onToken('AI ');
              await params.onToken('response ');
              await params.onToken('content');
            }
            return 'Mocked AI response content';
          });

        const mockClient: ResolvedClient = {
          providerId: 'ollama',
          modelId: 'llama3',
          complete: mockComplete,
          stream: mockStream,
        };
        return mockClient;
      }),
  })),
  getProviderRegistry: jest.fn().mockReturnValue([]),
  summarizePipeline: jest.fn(),
  chunkPipeline: jest.fn(),
}));

jest.mock('@upstash/qstash', () => ({
  Client: jest.fn().mockImplementation(() => ({
    publishJSON: jest
      .fn<(...args: MockArgs) => Promise<{ messageId: string }>>()
      .mockResolvedValue({ messageId: 'mock-message-id' }),
    publish: jest
      .fn<(...args: MockArgs) => Promise<{ messageId: string }>>()
      .mockResolvedValue({ messageId: 'mock-message-id' }),
  })),
  Receiver: jest.fn().mockImplementation(() => ({
    verify: jest
      .fn<(...args: MockArgs) => Promise<boolean>>()
      .mockResolvedValue(true),
  })),
}));

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest
      .fn<(...args: MockArgs) => Promise<string>>()
      .mockResolvedValue('mock-value'),
    set: jest
      .fn<(...args: MockArgs) => Promise<string>>()
      .mockResolvedValue('OK'),
    del: jest.fn<(...args: MockArgs) => Promise<number>>().mockResolvedValue(1),
    exists: jest
      .fn<(...args: MockArgs) => Promise<number>>()
      .mockResolvedValue(1),
    expire: jest
      .fn<(...args: MockArgs) => Promise<number>>()
      .mockResolvedValue(1),
  })),
}));
