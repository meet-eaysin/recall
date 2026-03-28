import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const nodeEnv = process.env.NODE_ENV ?? 'development';

function resolveEnvFileName(currentEnv: string): string {
  switch (currentEnv) {
    case 'production':
      return '.env.production';
    case 'test':
      return '.env.test';
    default:
      return '.env.local';
  }
}

const envFileName = resolveEnvFileName(nodeEnv);

const envCandidates = [
  path.resolve(process.cwd(), 'apps/api', envFileName),
  path.resolve(process.cwd(), envFileName),
  path.resolve(__dirname, '../../../', envFileName),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

interface EnvOptions {
  key: string;
  required?: boolean;
  defaultValue?: string;
}

function getEnv(options: EnvOptions): string {
  const required = options.required ?? true;
  const value = process.env[options.key] ?? options.defaultValue;
  if (required && value === undefined) {
    throw new Error(`Missing required environment variable: ${options.key}`);
  }
  return value ?? '';
}

function getWorkerUrl(): string {
  return getEnv({
    key: 'WORKER_URL',
    required: false,
    defaultValue: 'http://localhost:3002',
  });
}

type CacheProvider = 'redis' | 'upstash';
type QueueProvider = 'qstash' | 'http';
type StorageProvider = 'disk' | 'supabase';

function parseCacheProvider(
  value: string,
  fallback: CacheProvider,
): CacheProvider {
  if (value === 'redis' || value === 'upstash') {
    return value;
  }
  return fallback;
}

function parseQueueProvider(
  value: string,
  fallback: QueueProvider,
): QueueProvider {
  if (value === 'qstash' || value === 'http') {
    return value;
  }
  return fallback;
}

function parseStorageProvider(
  value: string,
  fallback: StorageProvider,
): StorageProvider {
  if (value === 'disk' || value === 'supabase') {
    return value;
  }
  return fallback;
}

export const env = {
  PORT: getEnv({ key: 'PORT', required: false, defaultValue: '3000' }),
  HOST: getEnv({ key: 'HOST', required: false, defaultValue: '0.0.0.0' }),
  NODE_ENV: getEnv({
    key: 'NODE_ENV',
    required: false,
    defaultValue: 'development',
  }),
  DEV_AUTH_ENABLED:
    getEnv({
      key: 'DEV_AUTH_ENABLED',
      required: false,
      defaultValue: 'true',
    }).toLowerCase() === 'true',
  MONGODB_URI: getEnv({ key: 'MONGODB_URI' }),
  WORKER_URL: getWorkerUrl(),
  QUEUE_PROVIDER: parseQueueProvider(
    getEnv({ key: 'QUEUE_PROVIDER', required: false, defaultValue: 'qstash' }),
    'qstash',
  ),
  QSTASH_TOKEN: getEnv({ key: 'QSTASH_TOKEN', required: false }),
  QSTASH_URL: getEnv({ key: 'QSTASH_URL', required: false }),

  CACHE_PROVIDER: parseCacheProvider(
    getEnv({ key: 'CACHE_PROVIDER', required: false, defaultValue: 'upstash' }),
    'upstash',
  ),
  REDIS_URL: getEnv({
    key: 'REDIS_URL',
    required: false,
    defaultValue: 'redis://localhost:6379',
  }),
  UPSTASH_REDIS_REST_URL: getEnv({
    key: 'UPSTASH_REDIS_REST_URL',
    required: false,
  }),
  UPSTASH_REDIS_REST_TOKEN: getEnv({
    key: 'UPSTASH_REDIS_REST_TOKEN',
    required: false,
  }),
  QDRANT_URL: getEnv({ key: 'QDRANT_URL' }),
  QDRANT_API_KEY: getEnv({ key: 'QDRANT_API_KEY', required: false }),
  OLLAMA_URL: getEnv({ key: 'OLLAMA_URL' }),
  DEFAULT_LLM_PROVIDER_ID: getEnv({
    key: 'DEFAULT_LLM_PROVIDER_ID',
    required: false,
    defaultValue: 'openrouter',
  }),
  DEFAULT_LLM_MODEL_ID: getEnv({
    key: 'DEFAULT_LLM_MODEL_ID',
    required: false,
    defaultValue: 'meta-llama/llama-3.3-70b-instruct:free',
  }),
  DEFAULT_LLM_API_KEY: getEnv({ key: 'DEFAULT_LLM_API_KEY', required: false }),
  DEFAULT_EMBEDDING_PROVIDER_ID: getEnv({
    key: 'DEFAULT_EMBEDDING_PROVIDER_ID',
    required: false,
    defaultValue: 'ollama',
  }),
  DEFAULT_EMBEDDING_MODEL_ID: getEnv({
    key: 'DEFAULT_EMBEDDING_MODEL_ID',
    required: false,
    defaultValue: 'nomic-embed-text',
  }),
  DEFAULT_EMBEDDING_API_KEY: getEnv({
    key: 'DEFAULT_EMBEDDING_API_KEY',
    required: false,
  }),
  GROQ_API_KEY: getEnv({ key: 'GROQ_API_KEY', required: false }),
  GOOGLE_AI_STUDIO_KEY: getEnv({
    key: 'GOOGLE_AI_STUDIO_KEY',
    required: false,
  }),
  JWT_SECRET: getEnv({ key: 'JWT_SECRET' }),
  JWT_EXPIRES_IN: getEnv({ key: 'JWT_EXPIRES_IN' }),
  REFRESH_TOKEN_SECRET: getEnv({ key: 'REFRESH_TOKEN_SECRET' }),
  REFRESH_TOKEN_EXPIRES_IN: getEnv({ key: 'REFRESH_TOKEN_EXPIRES_IN' }),
  ENCRYPTION_KEY: getEnv({ key: 'ENCRYPTION_KEY' }),
  GOOGLE_CLIENT_ID: getEnv({ key: 'GOOGLE_CLIENT_ID', required: false }),
  GOOGLE_CLIENT_SECRET: getEnv({
    key: 'GOOGLE_CLIENT_SECRET',
    required: false,
  }),
  GOOGLE_CALLBACK_URL: getEnv({ key: 'GOOGLE_CALLBACK_URL', required: false }),
  GITHUB_CLIENT_ID: getEnv({ key: 'GITHUB_CLIENT_ID', required: false }),
  GITHUB_CLIENT_SECRET: getEnv({
    key: 'GITHUB_CLIENT_SECRET',
    required: false,
  }),
  GITHUB_CALLBACK_URL: getEnv({ key: 'GITHUB_CALLBACK_URL', required: false }),
  WEB_APP_URL: getEnv({ key: 'WEB_APP_URL', required: false }),
  FILE_UPLOAD_DIR: getEnv({ key: 'FILE_UPLOAD_DIR' }),
  STORAGE_PROVIDER: parseStorageProvider(
    getEnv({ key: 'STORAGE_PROVIDER', required: false, defaultValue: 'disk' }),
    'disk',
  ),
  SUPABASE_URL: getEnv({ key: 'SUPABASE_URL', required: false }),
  SUPABASE_KEY: getEnv({ key: 'SUPABASE_KEY', required: false }),
  MAX_FILE_SIZE_MB: Number(
    getEnv({ key: 'MAX_FILE_SIZE_MB', required: false, defaultValue: '50' }),
  ),
  CORS_ORIGIN: getEnv({ key: 'CORS_ORIGIN' }),
};
