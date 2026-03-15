import { Types } from 'mongoose';
import { decrypt } from '@repo/crypto';
import { LLMConfig } from '@repo/types';
import { getProviderAdapter } from './provider.adapters';
import {
  getProviderAdapterKey,
  getProviderById,
  PROVIDER_REGISTRY,
} from './registry';
import type {
  ResolvedClient,
  ChatCompletionMessageParam,
} from './provider.clients';
import type { LlmFactoryOptions, ResolvedLLMConfig } from './provider.types';

export type { ResolvedClient, ChatCompletionMessageParam };
export type { ResolvedLLMConfig };

export class LLMClientFactory {
  private readonly options: LlmFactoryOptions;

  constructor(options: LlmFactoryOptions) {
    this.options = options;
  }

  resolveConfig(config?: LLMConfig | null): ResolvedLLMConfig {
    const useSystemDefault =
      !config || config.useSystemDefault === true || !config.providerId;

    // 1. Resolve Chat Configuration
    let providerId: string;
    let modelId: string;
    let apiKey: string | undefined;

    if (useSystemDefault) {
      providerId = this.options.defaultProviderId;
      modelId = this.options.defaultModelId;
      apiKey = this.options.defaultApiKey;
    } else {
      providerId = config.providerId;
      modelId = config.modelId;

      if (config.apiKey && this.options.encryptionKey) {
        try {
          apiKey = decrypt(config.apiKey, this.options.encryptionKey);
        } catch {
          throw new Error(
            'Failed to decrypt user API key. The key might be invalid or the encryption key changed.',
          );
        }
      }
    }

    const providerDef =
      getProviderById(providerId) || PROVIDER_REGISTRY[providerId];
    if (!providerDef && !useSystemDefault) {
      throw new Error(`Cannot resolve base URL for provider '${providerId}'.`);
    }

    const defaultBaseUrl = providerDef?.baseURL || 'http://localhost:11434';
    const baseUrl =
      providerId === 'ollama' && this.options.ollamaUrl
        ? this.options.ollamaUrl
        : defaultBaseUrl;

    const adapterKey =
      getProviderAdapterKey(providerId) ||
      (providerId === 'ollama' ? 'ollama' : 'openai');

    // 2. Resolve Embedding Configuration
    let embeddingProviderId: string = providerId;
    let resolvedEmbeddingModelId: string;
    let embeddingApiKey: string | undefined = apiKey;

    // Use separate system default for embeddings if available
    if (useSystemDefault && this.options.defaultEmbeddingProviderId) {
      embeddingProviderId = this.options.defaultEmbeddingProviderId;
      embeddingApiKey = this.options.defaultEmbeddingApiKey;
    }

    const embeddingProviderDef =
      getProviderById(embeddingProviderId) ||
      PROVIDER_REGISTRY[embeddingProviderId];

    resolvedEmbeddingModelId =
      config?.embeddingModelId ||
      embeddingProviderDef?.defaultEmbeddingModelId ||
      'nomic-embed-text';

    // Google specific logic for embedding models
    if (
      embeddingProviderId === 'google' &&
      embeddingProviderDef?.defaultEmbeddingModelId &&
      !this.isGoogleEmbeddingModel(
        resolvedEmbeddingModelId,
        embeddingProviderDef,
      )
    ) {
      resolvedEmbeddingModelId = embeddingProviderDef.defaultEmbeddingModelId;
    }

    const embeddingDefaultBaseUrl =
      embeddingProviderDef?.baseURL || 'http://localhost:11434';
    const embeddingBaseUrl =
      embeddingProviderId === 'ollama' && this.options.ollamaUrl
        ? this.options.ollamaUrl
        : embeddingDefaultBaseUrl;

    const embeddingAdapterKey =
      getProviderAdapterKey(embeddingProviderId) ||
      (embeddingProviderId === 'ollama' ? 'ollama' : 'openai');

    return {
      provider: providerId,
      chatModel: modelId,
      embeddingProvider: embeddingProviderId,
      embeddingModel: resolvedEmbeddingModelId,
      apiKey,
      embeddingApiKey,
      baseUrl,
      embeddingBaseUrl,
      adapterKey,
      embeddingAdapterKey,
      allowDevFallback: this.options.allowDevFallback === true,
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
          'System default LLM is enabled but no default API key is configured.',
        );
      }
    }

    const adapter = getProviderAdapter(resolved.adapterKey);
    return adapter.createClient(resolved);
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

  private isGoogleEmbeddingModel(
    modelId: string,
    providerDef: { models: Array<{ id: string; name: string }> },
  ): boolean {
    return providerDef.models.some(
      (model) =>
        model.id === modelId && model.name.toLowerCase().includes('embedding'),
    );
  }
}
