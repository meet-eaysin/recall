import { NestFactory } from '@nestjs/core';
import type { ValidationError, INestApplication } from '@nestjs/common';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { env } from './shared/utils/env';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const logger = new Logger('Bootstrap');

let cachedApp: INestApplication;

export async function bootstrap(): Promise<INestApplication> {
  if (cachedApp) return cachedApp;

  const app = await NestFactory.create(AppModule, {
    logger:
      env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Security & Middleware
  app.use(helmet());
  app.use(cookieParser());

  // CORS Configuration
  const origins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
  app.enableCors({
    origin: origins,
    credentials: true,
  });

  // Global Validation Pipe for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const formatErrors = (
          errs: ValidationError[],
        ): Record<string, string[]> => {
          const result: Record<string, string[]> = {};
          for (const error of errs) {
            if (error.constraints) {
              const constraints = error.constraints as Record<string, string>;
              result[error.property] = Object.values(constraints);
            }
            if (error.children && error.children.length > 0) {
              const childErrors = formatErrors(error.children);
              for (const [key, val] of Object.entries(childErrors)) {
                result[`${error.property}.${key}`] = val;
              }
            }
          }
          return result;
        };

        const messages = formatErrors(errors);

        return new BadRequestException({
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          details: Object.entries(messages).map(([field, msgs]) => ({
            field,
            messages: msgs,
          })),
        });
      },
    }),
  );

  // Versioned API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger OpenAPI Configuration
  if (env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Mind Stack API')
      .setDescription(
        'Production-grade API documentation for the Mind Stack backend.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'bearerAuth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
      customSiteTitle: 'Mind Stack API Documentation',
    });
  }

  await app.init();
  cachedApp = app;
  return app;
}

// For local development
if (require.main === module) {
  bootstrap()
    .then(async (app) => {
      const PORT = env.PORT;
      const HOST = env.HOST ?? '0.0.0.0';
      await app.listen(PORT, HOST);

      logger.log(
        `🚀 Application is running on: http://localhost:${PORT}/api/v1`,
      );
    })
    .catch((err) => {
      const message =
        err instanceof Error ? (err.stack ?? err.message) : String(err);
      logger.error(`💥 Failed to start application: ${message}`);
      process.exit(1);
    });
}

// Vercel handler
export default async (req: unknown, res: unknown): Promise<void> => {
  const app = await bootstrap();
  const server = app.getHttpAdapter().getInstance();
  return server(req, res);
};
