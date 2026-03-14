import axios from 'axios';
import { z } from 'zod';
import type { ResolvedLLMConfig } from './provider.factory';

const OllamaEmbeddingResponseSchema = z.object({
  embedding: z.array(z.number()),
});

const OpenAIEmbeddingItemSchema = z.object({
  embedding: z.array(z.number()),
});

const OpenAIEmbeddingResponseSchema = z.object({
  data: z.array(OpenAIEmbeddingItemSchema),
});

export class EmbeddingAdapter {
  async embedText(text: string, config: ResolvedLLMConfig): Promise<number[]> {
    if (config.provider === 'ollama') {
      try {
        const response = await axios.post(
          `${config.baseUrl}/api/embeddings`,
          {
            model: config.embeddingModel,
            prompt: text,
          },
          { timeout: 30000 },
        );
        const parsed = OllamaEmbeddingResponseSchema.parse(response.data);
        return parsed.embedding;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `[EmbeddingAdapter] Ollama unreachable, using random vector fallback for development`,
          );
          return Array.from({ length: 768 }, () => Math.random() * 2 - 1);
        }
        throw error;
      }
    }

    // Default to OpenAI-compatible
    const response = await axios.post(
      `${config.baseUrl || 'https://api.openai.com/v1'}/embeddings`,
      {
        model: config.embeddingModel,
        input: text,
      },
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
        timeout: 30000,
      },
    );
    const parsed = OpenAIEmbeddingResponseSchema.parse(response.data);
    const firstItem = parsed.data[0];
    if (!firstItem) {
      throw new Error('Empty embedding response from API');
    }
    return firstItem.embedding;
  }

  async embedBatch(
    texts: string[],
    config: ResolvedLLMConfig,
  ): Promise<number[][]> {
    if (config.provider === 'ollama') {
      try {
        // Use the newer /api/embed API for batches
        const response = await axios.post(`${config.baseUrl}/api/embed`, {
          model: config.embeddingModel,
          input: texts,
        });

        if (response.data.embeddings) {
          return response.data.embeddings;
        }

        // Fallback for older Ollama versions
        return Promise.all(texts.map((t) => this.embedText(t, config)));
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `[EmbeddingAdapter] Ollama unreachable, using random vector fallback for development`,
          );
          return texts.map(() =>
            Array.from({ length: 768 }, () => Math.random() * 2 - 1),
          );
        }
        // Fallback to sequential if /api/embed fails (404) or bad request
        if (axios.isAxiosError(error) && error.response?.status !== 500) {
          return Promise.all(texts.map((t) => this.embedText(t, config)));
        }
        throw error;
      }
    }

    // Default to OpenAI-compatible
    const response = await axios.post(
      `${config.baseUrl || 'https://api.openai.com/v1'}/embeddings`,
      {
        model: config.embeddingModel,
        input: texts,
      },
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
      },
    );
    const parsed = OpenAIEmbeddingResponseSchema.parse(response.data);
    return parsed.data.map((d) => d.embedding);
  }
}
export const embeddingAdapter = new EmbeddingAdapter();
