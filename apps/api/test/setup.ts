import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { INestApplication, ValidationError } from '@nestjs/common';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from '../src/app.module';
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
  process.env.DEV_AUTH_ENABLED = 'true';
  process.env.NODE_ENV = 'development';
  process.env.STORAGE_PROVIDER = 'disk';
  process.env.INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || '';

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
  app.setGlobalPrefix('api/v1');

  await app.init();
  return app;
}

export async function teardownApp(app: INestApplication): Promise<void> {
  if (app) {
    await app.close();
  }
}

export async function cleanupDatabase(): Promise<void> {
  await import('@repo/db');

  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({})),
  );
}
