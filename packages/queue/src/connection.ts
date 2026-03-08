import type { RedisOptions } from 'ioredis';
import { Redis } from 'ioredis';

const connectionCache = new Map<string, Redis>();

/**
 * Creates a shared Redis connection for BullMQ.
 * Set maxRetriesPerRequest to null as required by BullMQ.
 */
export function createRedisConnection(
  url: string,
  options: RedisOptions = {},
): Redis {
  const cacheKey = JSON.stringify({
    url,
    ...options,
  });

  const existingConnection = connectionCache.get(cacheKey);
  if (existingConnection) {
    return existingConnection;
  }

  const connection = new Redis(url, {
    connectTimeout: 10000,
    maxRetriesPerRequest: null,
    retryStrategy: (times) => {
      if (times >= 5) {
        return null;
      }

      return Math.min(times * 500, 5000);
    },
    ...options,
  });

  connectionCache.set(cacheKey, connection);
  return connection;
}
