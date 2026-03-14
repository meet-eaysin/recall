export interface LLMModel {
  id: string;
  name: string;
  contextWindow: number;
  free: boolean;
}

export interface LLMProvider {
  id: string;
  name: string;
  baseURL: string;
  requiresApiKey: boolean;
  defaultModel: string;
  models: LLMModel[];
}

export interface LLMConfig {
  providerId: string;
  modelId: string;
  embeddingModelId?: string;
  apiKey?: string;
  useSystemDefault: boolean;
}

export interface LLMSettingsResponse {
  config: (Omit<LLMConfig, 'apiKey'> & { hasApiKey: boolean }) | null;
  registry: LLMProvider[];
}

export interface UpdateLLMConfigRequest {
  providerId: string;
  modelId: string;
  embeddingModelId?: string;
  apiKey?: string;
  useSystemDefault: boolean;
}

export interface TestLLMConfigRequest {
  providerId: string;
  modelId: string;
  apiKey?: string;
  useSystemDefault: boolean;
  message?: string;
}
