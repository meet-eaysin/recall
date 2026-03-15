import type { LLMProvider } from '@repo/types';
import type { ProviderAdapterKey } from './provider.types';

export interface ProviderDefinition extends LLMProvider {
  adapterKey?: ProviderAdapterKey;
  defaultEmbeddingModelId?: string;
}

export const PROVIDER_REGISTRY: Record<string, ProviderDefinition> = {
  ollama: {
    id: 'ollama',
    name: 'Ollama',
    baseURL: 'http://localhost:11434',
    requiresApiKey: false,
    defaultModel: 'llama3',
    adapterKey: 'ollama',
    defaultEmbeddingModelId: 'nomic-embed-text',
    models: [
      {
        id: 'llama3',
        name: 'Llama 3',
        contextWindow: 8192,
        free: true,
      },
    ],
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    baseURL: 'https://openrouter.ai/api/v1',
    requiresApiKey: true,
    defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    adapterKey: 'openai',
    defaultEmbeddingModelId: 'nomic-embed-text',
    models: [
      {
        id: 'meta-llama/llama-3.3-70b-instruct:free',
        name: 'Llama 3.3 70B Instruct (Free)',
        contextWindow: 8192,
        free: true,
      },
      {
        id: 'google/gemini-2.0-flash-exp:free',
        name: 'Gemini 2.0 Flash Exp (Free)',
        contextWindow: 1000000,
        free: true,
      },
    ],
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    baseURL: 'https://api.groq.com/openai/v1',
    requiresApiKey: true,
    defaultModel: 'llama-3.3-70b-versatile',
    adapterKey: 'openai',
    defaultEmbeddingModelId: 'nomic-embed-text',
    models: [
      {
        id: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B Versatile',
        contextWindow: 128000,
        free: true,
      },
      {
        id: 'llama-3.1-8b-instant',
        name: 'Llama 3.1 8B Instant',
        contextWindow: 128000,
        free: true,
      },
      {
        id: 'mixtral-8x7b-32768',
        name: 'Mixtral 8x7B',
        contextWindow: 32768,
        free: true,
      },
      {
        id: 'deepseek-r1-distill-llama-70b',
        name: 'DeepSeek R1 Distill Llama 70B',
        contextWindow: 128000,
        free: true,
      },
    ],
  },
  google: {
    id: 'google',
    name: 'Google Gemini',
    baseURL: 'https://generativelanguage.googleapis.com',
    requiresApiKey: true,
    defaultModel: 'gemini-2.0-flash',
    adapterKey: 'google',
    defaultEmbeddingModelId: 'gemini-embedding-001',
    models: [
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        contextWindow: 1000000,
        free: true,
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        contextWindow: 1000000,
        free: true,
      },
      {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        contextWindow: 1000000,
        free: true,
      },
      {
        id: 'gemini-2.0-flash-lite-preview-02-05',
        name: 'Gemini 2.0 Flash Lite',
        contextWindow: 1000000,
        free: true,
      },
      {
        id: 'gemini-embedding-001',
        name: 'Gemini Embedding 001',
        contextWindow: 2048,
        free: true,
      },
      {
        id: 'gemini-embedding-2-preview',
        name: 'Gemini Embedding 2 Preview',
        contextWindow: 2048,
        free: true,
      },
    ],
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    requiresApiKey: true,
    defaultModel: 'gpt-4o-mini',
    adapterKey: 'openai',
    defaultEmbeddingModelId: 'text-embedding-3-small',
    models: [
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        contextWindow: 128000,
        free: false,
      },
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        contextWindow: 128000,
        free: false,
      },
    ],
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic (via OpenRouter)',
    baseURL: 'https://openrouter.ai/api/v1',
    requiresApiKey: true,
    defaultModel: 'anthropic/claude-3-5-sonnet',
    adapterKey: 'openai',
    defaultEmbeddingModelId: 'nomic-embed-text',
    models: [
      {
        id: 'anthropic/claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet',
        contextWindow: 200000,
        free: false,
      },
      {
        id: 'anthropic/claude-3-5-haiku',
        name: 'Claude 3.5 Haiku',
        contextWindow: 200000,
        free: false,
      },
    ],
  },
};

export const getProviderRegistry = (): LLMProvider[] => {
  return Object.values(PROVIDER_REGISTRY).map(
    ({ adapterKey, ...rest }) => rest,
  );
};

export const getProviderById = (id: string): ProviderDefinition | undefined => {
  return PROVIDER_REGISTRY[id];
};

export const getProviderAdapterKey = (
  id: string,
): ProviderAdapterKey | undefined => {
  return PROVIDER_REGISTRY[id]?.adapterKey;
};
