import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
import { Logger } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { connectMongoDB } from '@repo/db';
import { env } from './shared/utils/env';

const logger = new Logger('WorkerBootstrap');
let cachedApp: INestApplication;

export async function bootstrap(): Promise<INestApplication> {
  if (cachedApp) return cachedApp;

  try {
    await connectMongoDB(env.MONGODB_URI);
    logger.log('Connected to MongoDB');

    const app = await NestFactory.create(WorkerModule, { rawBody: true });

    await app.init();
    cachedApp = app;
    return app;
  } catch (error) {
    logger.error('Worker failed to initialize', error);
    throw error;
  }
}

if (require.main === module) {
  bootstrap()
    .then(async (app) => {
      const port = env.PORT || 3002;
      await app.listen(port);
      logger.log(`Worker Webhook Server listening on port ${port}`);

      process.on('SIGTERM', async () => {
        logger.log('SIGTERM signal received: closing worker');
        await app.close();
        process.exit(0);
      });
    })
    .catch((error) => {
      logger.error('Worker failed to start', error);
      process.exit(1);
    });
}

export default async (req: unknown, res: unknown): Promise<void> => {
  const app = await bootstrap();
  const server = app.getHttpAdapter().getInstance();
  return server(req, res);
};
