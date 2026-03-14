import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
import { Logger } from '@nestjs/common';
import { connectMongoDB } from '@repo/db';
import { env } from './shared/utils/env';

async function bootstrap() {
  const logger = new Logger('WorkerBootstrap');

  try {
    // Database connection
    await connectMongoDB(env.MONGODB_URI);
    logger.log('Connected to MongoDB');

    const app = await NestFactory.create(WorkerModule, { rawBody: true });

    const port = env.PORT || 3002;
    await app.listen(port);

    logger.log(`Worker Webhook Server listening on port ${port}`);

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.log('SIGTERM signal received: closing worker');
      await app.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Worker failed to start', error);
    process.exit(1);
  }
}

void bootstrap();
