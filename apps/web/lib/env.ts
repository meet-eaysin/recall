import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  NEXT_PUBLIC_API_BASE_URL: z.string().optional(),
  NEXT_PUBLIC_ENABLE_DEV_AUTH: z.string().optional(),
  NEXT_PUBLIC_DEV_USER_ID: z.string().optional(),
});

const parsed = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_ENABLE_DEV_AUTH: process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH,
  NEXT_PUBLIC_DEV_USER_ID: process.env.NEXT_PUBLIC_DEV_USER_ID,
});

if (!parsed.success) {
  console.error(
    '❌ Invalid environment variables:',
    parsed.error.flatten().fieldErrors,
  );
  throw new Error('Invalid environment variables');
}

const rawEnv = parsed.data;

export const env = {
  ...rawEnv,
  get isProduction(): boolean {
    return this.NODE_ENV === 'production';
  },
  get isDevelopment(): boolean {
    return this.NODE_ENV === 'development';
  },
  get isDevAuthEnabled(): boolean {
    return this.NEXT_PUBLIC_ENABLE_DEV_AUTH !== undefined
      ? this.NEXT_PUBLIC_ENABLE_DEV_AUTH === 'true'
      : this.isDevelopment;
  },
  get apiBaseUrl(): string {
    const raw =
      this.NEXT_PUBLIC_API_BASE_URL ||
      (this.isDevelopment ? 'http://localhost:3001/api/v1' : '');
    if (typeof window !== 'undefined' && this.isProduction) {
      return '/api/v1';
    }

    return raw.endsWith('/api/v1') ? raw : raw ? `${raw}/api/v1` : '';
  },
  get apiRewriteDestination(): string {
    const raw =
      this.NEXT_PUBLIC_API_BASE_URL ||
      (this.isDevelopment ? 'http://localhost:3001/api/v1' : '');
    return raw.endsWith('/api/v1') ? raw : raw ? `${raw}/api/v1` : '';
  },
};
