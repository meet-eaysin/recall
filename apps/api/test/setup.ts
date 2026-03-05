import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/shared/filters/http-exception.filter';
import { connectMongoDB, disconnectMongoDB } from '@repo/db';
import { env } from '../src/shared/utils/env';

// Standard Jest mocks to bypass problematic ESM dependencies across all E2E tests
jest.mock('@repo/ai', () => ({
  QdrantWrapper: jest.fn().mockImplementation(() => ({})),
  ProviderFactory: jest.fn().mockImplementation(() => ({})),
  EmbeddingAdapter: jest.fn().mockImplementation(() => ({})),
  YouTubeExtractor: jest.fn().mockImplementation(() => ({})),
  UrlExtractor: jest.fn().mockImplementation(() => ({})),
  PdfExtractor: jest.fn().mockImplementation(() => ({})),
  ImageExtractor: jest.fn().mockImplementation(() => ({})),
  summarizePipeline: jest.fn(),
  chunkPipeline: jest.fn(),
}));

jest.mock('@repo/queue', () => ({
  Queue: jest.fn().mockImplementation(() => ({})),
  Worker: jest.fn().mockImplementation(() => ({})),
  createRedisConnection: jest.fn().mockImplementation(() => ({})),
  initQueues: jest.fn(),
}));


export async function setupApp(): Promise<INestApplication> {
  await connectMongoDB(env.MONGODB_URI);
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.setGlobalPrefix('api/v1');

  await app.init();
  return app;
}

export async function teardownApp(app: INestApplication): Promise<void> {
  await app.close();
  await disconnectMongoDB();
}
