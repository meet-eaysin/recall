process.env.NODE_ENV = 'development';
process.env.DEV_AUTH_ENABLED = 'true';

process.env.WORKER_URL = 'http://localhost:3002';
process.env.CACHE_PROVIDER = 'upstash';

process.env.QSTASH_TOKEN = 'test-qstash-token';
process.env.QSTASH_URL = 'https://qstash.upstash.io/v2/publish';
process.env.UPSTASH_REDIS_REST_URL = 'https://mock.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
