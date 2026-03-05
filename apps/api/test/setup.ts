import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/shared/filters/http-exception.filter';
import { connectMongoDB, disconnectMongoDB } from '@repo/db';
import { env } from '../src/shared/utils/env';
import mongoose from 'mongoose';

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

/**
 * Cleanup ALL collections in the current database.
 * Useful for ensuring a clean state between E2E test runs.
 */
export async function cleanupDatabase(): Promise<void> {
  // Ensure all models are registered
  await import('@repo/db');
  
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({})),
  );
}
