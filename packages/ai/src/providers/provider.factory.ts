import { Types } from 'mongoose';
import { decrypt } from '@repo/crypto';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { LLMConfig } from '@repo/types';
import { getProviderById, PROVIDER_REGISTRY } from './registry';
import type { ChatCompletionMessageParam as OpenAIParam } from 'openai/resources/chat/completions';
export type ChatCompletionMessageParam = OpenAIParam;

export interface ResolvedClient {
  readonly providerId: string;
  readonly modelId: string;

  complete(params: {
    messages: ChatCompletionMessageParam[];
    temperature?: number;
  }): Promise<string>;

  stream(params: {
    messages: ChatCompletionMessageParam[];
    temperature?: number;
    onToken: (token: string) => Promise<void> | void;
  }): Promise<string>;
}

class OpenAIResolvedClient implements ResolvedClient {
  constructor(
    private client: OpenAI,
    public readonly providerId: string,
    public readonly modelId: string,
  ) {}

  async complete(params: {
    messages: ChatCompletionMessageParam[];
    temperature?: number;
  }): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.modelId,
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
      });
      return response.choices[0]?.message?.content || '';
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`LLM call failed (${this.providerId}): ${message}`);
    }
  }

  async stream(params: {
    messages: ChatCompletionMessageParam[];
    temperature?: number;
    onToken: (token: string) => Promise<void> | void;
  }): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.modelId,
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        stream: true,
      });

      let fullText = '';
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullText += content;
          await params.onToken(content);
        }
      }
      return fullText;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`LLM streaming failed (${this.providerId}): ${message}`);
    }
  }
}

class GeminiResolvedClient implements ResolvedClient {
  private client: GoogleGenAI;

  constructor(
    apiKey: string,
    public readonly providerId: string,
    public readonly modelId: string,
  ) {
    this.client = new GoogleGenAI({ apiKey });
  }

  private mapMessages(messages: ChatCompletionMessageParam[]) {
    // Gemini roles: user, model
    // OpenAI roles: system, user, assistant
    return messages.map((m) => {
      let role = 'user';
      if (m.role === 'assistant') role = 'model';
      // System prompts are usually handled separately or prepended to first user message in simple maps
      // For @google/genai, we can try to use systemInstruction if the SDK supports it in the model config,
      // but for simplicity in this mapping we treat system as user for now if needed.
      return {
        role,
        parts: [{ text: String(m.content) }],
      };
    });
  }

  async complete(params: {
    messages: ChatCompletionMessageParam[];
    temperature?: number;
  }): Promise<string> {
    try {
      const response = await this.client.models.generateContent({
        model: this.modelId,
        contents: this.mapMessages(params.messages),
        config: {
          temperature: params.temperature,
        },
      });
      return response.text ?? '';
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`LLM call failed (gemini): ${message}`);
    }
  }

  async stream(params: {
    messages: ChatCompletionMessageParam[];
    temperature?: number;
    onToken: (token: string) => Promise<void> | void;
  }): Promise<string> {
    try {
      const response = await this.client.models.generateContentStream({
        model: this.modelId,
        contents: this.mapMessages(params.messages),
        config: {
          temperature: params.temperature,
        },
      });

      let fullText = '';
      for await (const chunk of response) {
        const content = chunk.text || '';
        if (content) {
          fullText += content;
          await params.onToken(content);
        }
      }
      return fullText;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`LLM streaming failed (gemini): ${message}`);
    }
  }
}

export interface ResolvedLLMConfig {
  provider: string;
  chatModel: string;
  embeddingModel: string;
  apiKey: string | undefined;
  baseUrl: string;
}

export class LLMClientFactory {
  resolveConfig(config?: LLMConfig | null): ResolvedLLMConfig {
    const useSystemDefault = !config || config.useSystemDefault;

    let providerId: string;
    let modelId: string;
    let apiKey: string | undefined;
    let embeddingModelId = 'nomic-embed-text';

    if (useSystemDefault) {
      providerId = process.env.DEFAULT_LLM_PROVIDER_ID || 'openrouter';
      modelId =
        process.env.DEFAULT_LLM_MODEL_ID ||
        'meta-llama/llama-3.3-70b-instruct:free';
      apiKey = process.env.DEFAULT_LLM_API_KEY;
    } else {
      providerId = config.providerId;
      modelId = config.modelId;
      if (config.embeddingModelId) {
        embeddingModelId = config.embeddingModelId;
      }

      const provider =
        getProviderById(providerId) || PROVIDER_REGISTRY[providerId];
      if (!provider) {
        throw new Error(
          `Configured provider '${providerId}' does not exist in the registry.`,
        );
      }

      if (config.apiKey && process.env.ENCRYPTION_KEY) {
        try {
          apiKey = decrypt(config.apiKey, process.env.ENCRYPTION_KEY);
        } catch {
          throw new Error(
            'Failed to decrypt user API key. The key might be invalid or the encryption key changed.',
          );
        }
      }

      if (!apiKey && provider.requiresApiKey) {
        throw new Error(
          `User configured provider '${providerId}' requires an API key, but none was provided.`,
        );
      }
    }

    const providerDef =
      getProviderById(providerId) || PROVIDER_REGISTRY[providerId];
    if (!providerDef && !useSystemDefault) {
      throw new Error(`Cannot resolve base URL for provider '${providerId}'.`);
    }

    const baseUrl = providerDef?.baseURL || 'http://localhost:11434';

    return {
      provider: providerId,
      chatModel: modelId,
      embeddingModel: embeddingModelId,
      apiKey,
      baseUrl,
    };
  }

  async createForUser(config?: LLMConfig | null): Promise<ResolvedClient> {
    const resolved = this.resolveConfig(config);

    if (
      !resolved.apiKey &&
      resolved.provider !== 'ollama' &&
      resolved.provider !== 'local'
    ) {
      if (!config || config.useSystemDefault) {
        throw new Error(
          'System default LLM is enabled but DEFAULT_LLM_API_KEY is not set in environment variables.',
        );
      }
    }

    if (resolved.provider === 'google') {
      return new GeminiResolvedClient(
        resolved.apiKey || '',
        resolved.provider,
        resolved.chatModel,
      );
    }

    const client = new OpenAI({
      apiKey: resolved.apiKey || 'dummy-key-not-required',
      baseURL: resolved.baseUrl,
      dangerouslyAllowBrowser: false,
    });

    return new OpenAIResolvedClient(
      client,
      resolved.provider,
      resolved.chatModel,
    );
  }

  async resolveConfigForUserId(userId: string): Promise<ResolvedLLMConfig> {
    if (!Types.ObjectId.isValid(userId)) {
      return this.resolveConfig(null);
    }

    const { UserModel } = await import('@repo/db');
    const user = await UserModel.findById(userId).select('llmConfig').lean();

    return this.resolveConfig(user?.llmConfig);
  }

  async createForUserId(userId: string): Promise<ResolvedClient> {
    if (!Types.ObjectId.isValid(userId)) {
      return this.createForUser(null);
    }

    const { UserModel } = await import('@repo/db');
    const user = await UserModel.findById(userId).select('llmConfig').lean();

    if (!user || !user.llmConfig) {
      return this.createForUser(null);
    }

    return this.createForUser(user.llmConfig);
  }
}
