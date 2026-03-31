process.env.NODE_ENV = 'development';
process.env.STORAGE_PROVIDER = 'disk';
process.env.DEV_AUTH_ENABLED = 'true';
process.env.INTERNAL_API_SECRET = 'test-internal-api-secret';

process.env.WORKER_URL = 'http://localhost:3002';
process.env.CACHE_PROVIDER = 'upstash';

process.env.QSTASH_TOKEN = 'test-qstash-token';
process.env.UPSTASH_REDIS_REST_URL = 'https://mock.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
