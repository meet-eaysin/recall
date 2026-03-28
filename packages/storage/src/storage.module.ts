import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { StorageConfig, IStorageProvider } from './types';
import { createStorageProvider } from './index';

@Global()
@Module({})
export class StorageModule {
  static forRoot(config: StorageConfig): DynamicModule {
    const storageProvider: Provider = {
      provide: IStorageProvider,
      useFactory: () => createStorageProvider(config),
    };

    return {
      module: StorageModule,
      providers: [storageProvider],
      exports: [storageProvider],
    };
  }
}
