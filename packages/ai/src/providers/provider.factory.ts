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
    const useSystemDefault = !config || config.useSystemDefault;

    let providerId: string;
    let modelId: string;
    let apiKey: string | undefined;
    let embeddingModelId: string | undefined;

    if (useSystemDefault) {
      providerId = this.options.defaultProviderId;
      modelId = this.options.defaultModelId;
      apiKey = this.options.defaultApiKey;
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

      if (config.apiKey && this.options.encryptionKey) {
        try {
          apiKey = decrypt(config.apiKey, this.options.encryptionKey);
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

    const defaultBaseUrl = providerDef?.baseURL || 'http://localhost:11434';
    const baseUrl =
      providerId === 'ollama' && this.options.ollamaUrl
        ? this.options.ollamaUrl
        : defaultBaseUrl;

    let resolvedEmbeddingModelId =
      embeddingModelId ||
      providerDef?.defaultEmbeddingModelId ||
      'nomic-embed-text';

    if (
      providerId === 'google' &&
      providerDef?.defaultEmbeddingModelId &&
      !this.isGoogleEmbeddingModel(resolvedEmbeddingModelId, providerDef)
    ) {
      resolvedEmbeddingModelId = providerDef.defaultEmbeddingModelId;
    }
    const adapterKey =
      getProviderAdapterKey(providerId) ||
      (providerId === 'ollama' ? 'ollama' : 'openai');

    return {
      provider: providerId,
      chatModel: modelId,
      embeddingModel: resolvedEmbeddingModelId,
      apiKey,
      baseUrl,
      adapterKey,
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
