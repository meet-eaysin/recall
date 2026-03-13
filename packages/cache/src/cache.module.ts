import { DynamicModule, Module, Global, Provider } from '@nestjs/common';
import { ICacheProvider } from './interfaces/cache-provider.interface';
import { UpstashCacheProvider } from './providers/upstash-cache.provider';
import { RedisCacheProvider } from './providers/redis-cache.provider';

export interface CacheModuleOptions {
  provider: 'upstash' | 'redis';
  upstash?: {
    url: string;
    token: string;
  };
  redis?: {
    url: string;
  };
}

@Global()
@Module({})
export class CacheModule {
  static forRoot(options: CacheModuleOptions): DynamicModule {
    const providers: Provider[] = [];

    if (options.provider === 'upstash') {
      if (!options.upstash) {
        throw new Error('Upstash configuration is required for Upstash provider');
      }

      providers.push({
        provide: ICacheProvider,
        useValue: new UpstashCacheProvider(options.upstash.url, options.upstash.token),
      });
    } else if (options.provider === 'redis') {
      if (!options.redis) {
        throw new Error('Redis configuration is required for Redis provider');
      }

      providers.push({
        provide: ICacheProvider,
        useValue: new RedisCacheProvider(options.redis.url),
      });
    } else {
      throw new Error(`Provider ${options.provider} not supported`);
    }

    return {
      module: CacheModule,
      providers,
      exports: providers,
    };
  }
}
