import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { INestApplication, ValidationError } from '@nestjs/common';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { connectMongoDB, disconnectMongoDB } from '@repo/db';
import { env } from '../src/shared/utils/env';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';

function formatValidationErrors(
  errs: ValidationError[],
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const error of errs) {
    if (error.constraints) {
      const constraints = error.constraints as Record<string, string>;
      result[error.property] = Object.values(constraints);
    }
    if (error.children && error.children.length > 0) {
      const childErrors = formatValidationErrors(error.children);
      for (const [key, val] of Object.entries(childErrors)) {
        result[`${error.property}.${key}`] = val;
      }
    }
  }
  return result;
}

export async function setupApp(): Promise<INestApplication> {
  await connectMongoDB(env.MONGODB_URI);
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = formatValidationErrors(errors);
        return new BadRequestException({
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          details: Object.entries(messages).map(([field, message]) => ({
            field,
            message: message[0],
          })),
        });
      },
    }),
  );
  // Global filters and interceptors are handled via AppModule
  app.setGlobalPrefix('api/v1');

  // app.init() triggers AppModule.onModuleInit() which calls connectMongoDB
  await app.init();
  return app;
}

export async function teardownApp(app: INestApplication): Promise<void> {
  if (app) {
    await app.close();
  }
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
