import { LLMProvider } from '@repo/types';

export const PROVIDER_REGISTRY: Record<string, LLMProvider> = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    baseURL: 'https://openrouter.ai/api/v1',
    requiresApiKey: true,
    defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
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
    models: [
      {
        id: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B Versatile',
        contextWindow: 8192,
        free: true,
      },
      {
        id: 'mixtral-8x7b-32768',
        name: 'Mixtral 8x7B',
        contextWindow: 32768,
        free: true,
      },
    ],
  },
  google: {
    id: 'google',
    name: 'Google Gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    requiresApiKey: true,
    defaultModel: 'gemini-2.5-flash',
    models: [
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        contextWindow: 1000000,
        free: true,
      },
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        contextWindow: 1000000,
        free: true,
      },
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        contextWindow: 1000000,
        free: true,
      },
      {
        id: 'gemini-3.1-flash',
        name: 'Gemini 3.1 Flash',
        contextWindow: 1000000,
        free: true,
      },
      {
        id: 'gemini-3.1-pro-preview',
        name: 'Gemini 3.1 Pro (Preview)',
        contextWindow: 1000000,
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
  return Object.values(PROVIDER_REGISTRY);
};

export const getProviderById = (id: string): LLMProvider | undefined => {
  return PROVIDER_REGISTRY[id];
};
