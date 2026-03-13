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

function getEnv(key: string, required = true, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (required && value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value ?? '';
}

export const env = {
  NODE_ENV: getEnv('NODE_ENV', false, 'development'),
  MONGODB_URI: getEnv('MONGODB_URI'),
  REDIS_HOST: getEnv('REDIS_HOST'),
  REDIS_PORT: Number(getEnv('REDIS_PORT', false, '6379')),
  REDIS_PASSWORD: getEnv('REDIS_PASSWORD', false),
  QDRANT_URL: getEnv('QDRANT_URL'),
  QDRANT_API_KEY: getEnv('QDRANT_API_KEY', false),
  OLLAMA_URL: getEnv('OLLAMA_URL'),
  FILE_UPLOAD_DIR: getEnv('FILE_UPLOAD_DIR'),
  ENCRYPTION_KEY: getEnv('ENCRYPTION_KEY'),
};
