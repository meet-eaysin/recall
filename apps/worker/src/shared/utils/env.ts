import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

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
const envPath = path.resolve(process.cwd(), envFileName);

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
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

type CacheProvider = 'redis' | 'upstash';
type QueueProvider = 'qstash' | 'http';
type EmailProvider = 'resend';
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

function parseEmailProvider(
  value: string,
  fallback: EmailProvider,
): EmailProvider {
  if (value === 'resend') {
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
  PORT: getEnv({ key: 'PORT', required: false, defaultValue: '3002' }),
  NODE_ENV: getEnv({
    key: 'NODE_ENV',
    required: false,
    defaultValue: 'development',
  }),
  MONGODB_URI: getEnv({ key: 'MONGODB_URI' }),
  WORKER_URL: getEnv({
    key: 'WORKER_URL',
    required: false,
    defaultValue: 'http://localhost:3002',
  }),
  API_INTERNAL_URL: getEnv({
    key: 'API_INTERNAL_URL',
    required: false,
    defaultValue: 'http://localhost:3000/api/v1/internal/worker',
  }),
  INTERNAL_API_SECRET: getEnv({ key: 'INTERNAL_API_SECRET' }),
  QUEUE_PROVIDER: parseQueueProvider(
    getEnv({ key: 'QUEUE_PROVIDER', required: false, defaultValue: 'qstash' }),
    'qstash',
  ),
  QSTASH_TOKEN: getEnv({ key: 'QSTASH_TOKEN', required: false }),
  QSTASH_URL: getEnv({ key: 'QSTASH_URL', required: false }),

  QSTASH_CURRENT_SIGNING_KEY: getEnv({
    key: 'QSTASH_CURRENT_SIGNING_KEY',
    required: false,
  }),
  QSTASH_NEXT_SIGNING_KEY: getEnv({
    key: 'QSTASH_NEXT_SIGNING_KEY',
    required: false,
  }),
  EMAIL_PROVIDER: parseEmailProvider(
    getEnv({ key: 'EMAIL_PROVIDER', required: false, defaultValue: 'resend' }),
    'resend',
  ),
  RESEND_API_KEY: getEnv({ key: 'RESEND_API_KEY', required: false }),
  EMAIL_FROM: getEnv({ key: 'EMAIL_FROM', required: false }),
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
  ENCRYPTION_KEY: getEnv({ key: 'ENCRYPTION_KEY' }),
};
