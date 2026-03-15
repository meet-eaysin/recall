import axios from 'axios';
import OpenAI from 'openai';
import { z } from 'zod';
import { GoogleEmbeddingAdapter } from './google-embedding.adapter';
import { OpenAIResolvedClient, GeminiResolvedClient } from './provider.clients';
import type { ResolvedClient } from './provider.clients';
import type { ProviderAdapterKey, ResolvedLLMConfig } from './provider.types';

export interface ProviderAdapter {
  key: ProviderAdapterKey;
  createClient(config: ResolvedLLMConfig): ResolvedClient;
  embedText(text: string, config: ResolvedLLMConfig): Promise<number[]>;
  embedBatch(texts: string[], config: ResolvedLLMConfig): Promise<number[][]>;
}

const OllamaEmbeddingResponseSchema = z.object({
  embedding: z.array(z.number()),
});

const OpenAIEmbeddingItemSchema = z.object({
  embedding: z.array(z.number()),
});

const OpenAIEmbeddingResponseSchema = z.object({
  data: z.array(OpenAIEmbeddingItemSchema),
});

const createOpenAIClient = (config: ResolvedLLMConfig) => {
  return new OpenAI({
    apiKey: config.apiKey || 'dummy-key-not-required',
    baseURL: config.baseUrl,
    dangerouslyAllowBrowser: false,
  });
};

const openaiAdapter: ProviderAdapter = {
  key: 'openai',
  createClient: (config) =>
    new OpenAIResolvedClient(
      createOpenAIClient(config),
      config.provider,
      config.chatModel,
    ),
  embedText: async (text, config) => {
    const headers: Record<string, string> = {};
    if (config.embeddingApiKey) {
      headers.Authorization = `Bearer ${config.embeddingApiKey}`;
    }
    const response = await axios.post(
      `${config.embeddingBaseUrl || 'https://api.openai.com/v1'}/embeddings`,
      {
        model: config.embeddingModel,
        input: text,
      },
      {
        headers,
        timeout: 60000,
      },
    );
    const parsed = OpenAIEmbeddingResponseSchema.parse(response.data);
    const firstItem = parsed.data[0];
    if (!firstItem) {
      throw new Error('Empty embedding response from API');
    }
    return firstItem.embedding;
  },
  embedBatch: async (texts, config) => {
    const headers: Record<string, string> = {};
    if (config.embeddingApiKey) {
      headers.Authorization = `Bearer ${config.embeddingApiKey}`;
    }
    const response = await axios.post(
      `${config.embeddingBaseUrl || 'https://api.openai.com/v1'}/embeddings`,
      {
        model: config.embeddingModel,
        input: texts,
      },
      {
        headers,
        timeout: 60000,
      },
    );
    const parsed = OpenAIEmbeddingResponseSchema.parse(response.data);
    return parsed.data.map((d) => d.embedding);
  },
};

const googleAdapter: ProviderAdapter = {
  key: 'google',
  createClient: (config) =>
    new GeminiResolvedClient(
      config.apiKey || '',
      config.provider,
      config.chatModel,
    ),
  embedText: async (text, config) => {
    const adapter = new GoogleEmbeddingAdapter(config.embeddingApiKey || '');
    return adapter.embedText(text, config);
  },
  embedBatch: async (texts, config) => {
    const adapter = new GoogleEmbeddingAdapter(config.embeddingApiKey || '');
    return adapter.embedBatch(texts, config);
  },
};

const ollamaAdapter: ProviderAdapter = {
  key: 'ollama',
  createClient: (config) =>
    new OpenAIResolvedClient(
      createOpenAIClient(config),
      config.provider,
      config.chatModel,
    ),
  embedText: async (text, config) => {
    try {
      const response = await axios.post(
        `${config.embeddingBaseUrl}/api/embeddings`,
        {
          model: config.embeddingModel,
          prompt: text,
        },
        { timeout: 60000 },
      );
      const parsed = OllamaEmbeddingResponseSchema.parse(response.data);
      return parsed.embedding;
    } catch (error) {
      if (config.allowDevFallback) {
        return Array.from({ length: 768 }, () => Math.random() * 2 - 1);
      }
      throw error;
    }
  },
  embedBatch: async (texts, config) => {
    try {
      const response = await axios.post(
        `${config.embeddingBaseUrl}/api/embed`,
        {
          model: config.embeddingModel,
          input: texts,
        },
      );

      if (response.data.embeddings) {
        return response.data.embeddings;
      }

      return Promise.all(texts.map((t) => ollamaAdapter.embedText(t, config)));
    } catch (error) {
      if (config.allowDevFallback) {
        return texts.map(() =>
          Array.from({ length: 768 }, () => Math.random() * 2 - 1),
        );
      }
      if (axios.isAxiosError(error) && error.response?.status !== 500) {
        return Promise.all(
          texts.map((t) => ollamaAdapter.embedText(t, config)),
        );
      }
      throw error;
    }
  },
};

const ADAPTERS: Record<ProviderAdapterKey, ProviderAdapter> = {
  openai: openaiAdapter,
  google: googleAdapter,
  ollama: ollamaAdapter,
};

export const getProviderAdapter = (key: ProviderAdapterKey): ProviderAdapter =>
  ADAPTERS[key] || openaiAdapter;
