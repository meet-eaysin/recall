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

jest.mock('@repo/ai', () => ({
  QdrantWrapper: jest.fn().mockImplementation(() => ({
    searchSimilar: jest.fn<() => Promise<MockQdrantResult[]>>().mockResolvedValue([
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
    embedText: jest.fn<() => Promise<number[]>>().mockResolvedValue(Array.from({ length: 384 }, () => 0)),
    embedBatch: jest.fn<() => Promise<number[][]>>().mockResolvedValue([Array.from({ length: 384 }, () => 0)]),
  },
  EmbeddingAdapter: jest.fn().mockImplementation(() => ({
    embedText: jest.fn<() => Promise<number[]>>().mockResolvedValue(Array.from({ length: 384 }, () => 0)),
  })),
  YouTubeExtractor: jest.fn().mockImplementation(() => ({})),
  UrlExtractor: jest.fn().mockImplementation(() => ({})),
  PdfExtractor: jest.fn().mockImplementation(() => ({})),
  ImageExtractor: jest.fn().mockImplementation(() => ({})),
  summarizePipeline: jest.fn(),
  chunkPipeline: jest.fn(),
}));

jest.mock('@repo/queue', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn<() => Promise<Record<string, unknown>>>().mockResolvedValue({}),
    process: jest.fn(),
    on: jest.fn(),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn<() => Promise<Record<string, unknown>>>().mockResolvedValue({}),
  })),
  createRedisConnection: jest.fn().mockReturnValue({}),
  initQueues: jest.fn(),
  ingestionQueue: { addJob: jest.fn(() => Promise.resolve({})) },
  summaryQueue: { addJob: jest.fn(() => Promise.resolve({})) },
  graphQueue: { addJob: jest.fn(() => Promise.resolve({})) },
  notionQueue: { addJob: jest.fn(() => Promise.resolve({})) },
  transcriptQueue: { addJob: jest.fn(() => Promise.resolve({})) },
}));
