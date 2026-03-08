import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import type { LLMCapabilities } from '@repo/types';

@Injectable()
export class LLMValidatorService {
  private readonly logger = new Logger(LLMValidatorService.name);
  async validate(
    provider: string,
    apiKey: string | null,
    baseUrl: string | null,
    chatModel: string,
    embeddingModel: string,
  ): Promise<LLMCapabilities> {
    const results = await Promise.all([
      this.testChat(provider, apiKey, baseUrl, chatModel),
      this.testEmbeddings(provider, apiKey, baseUrl, embeddingModel),
    ]);

    return {
      chat: results[0],
      embeddings: results[1],
    };
  }

  private async testChat(
    provider: string,
    apiKey: string | null,
    baseUrl: string | null,
    model: string,
  ): Promise<boolean> {
    try {
      if (provider === 'ollama') {
        const url = `${baseUrl || 'http://localhost:11434'}/api/chat`;
        const response = await axios.post(
          url,
          {
            model,
            messages: [{ role: 'user', content: 'Say hi' }],
            stream: false,
          },
          { timeout: 10000 },
        );
        return typeof response.data.message.content === 'string';
      }

      if (provider === 'openai') {
        const url = 'https://api.openai.com/v1/chat/completions';
        const response = await axios.post(
          url,
          {
            model: model || 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Say hi' }],
          },
          {
            headers: { Authorization: `Bearer ${apiKey}` },
            timeout: 10000,
          },
        );
        return typeof response.data.choices[0].message.content === 'string';
      }

      // Anthropic or others can be added here
      return false;
    } catch (error) {
      // Masking API key in logs
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Chat test failed: ${errorMsg.replace(apiKey || '', '***')}`,
      );
      return false;
    }
  }

  private async testEmbeddings(
    provider: string,
    apiKey: string | null,
    baseUrl: string | null,
    model: string,
  ): Promise<boolean> {
    try {
      if (provider === 'ollama') {
        const url = `${baseUrl || 'http://localhost:11434'}/api/embeddings`;
        const response = await axios.post(
          url,
          {
            model,
            prompt: 'hello',
          },
          { timeout: 10000 },
        );
        return Array.isArray(response.data.embedding);
      }

      if (provider === 'openai') {
        const url = 'https://api.openai.com/v1/embeddings';
        const response = await axios.post(
          url,
          {
            model: model || 'text-embedding-3-small',
            input: 'hello',
          },
          {
            headers: { Authorization: `Bearer ${apiKey}` },
            timeout: 10000,
          },
        );
        return Array.isArray(response.data.data[0].embedding);
      }

      return false;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Embedding test failed: ${errorMsg.replace(apiKey || '', '***')}`,
      );
      return false;
    }
  }
}
