import mongoose from 'mongoose';

const TEST_SERVER_SELECTION_TIMEOUT_MS = 5_000;

function resolveMongoOptions() {
  if (process.env.NODE_ENV === 'test') {
    return {
      serverSelectionTimeoutMS: TEST_SERVER_SELECTION_TIMEOUT_MS,
    };
  }

  return undefined;
}

export async function connectMongoDB(uri: string): Promise<void> {
  if (mongoose.connection.readyState === 1) return;

  if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
    return;
  }

  await mongoose.connect(uri, resolveMongoOptions());
}

export async function disconnectMongoDB(): Promise<void> {
  if (mongoose.connection.readyState === 0) return;

  await mongoose.disconnect();
}

mongoose.connection.on('connected', () => {
  // Silent
});

mongoose.connection.on('error', () => {
  // Silent
});

mongoose.connection.on('disconnected', () => {
  // Silent
});
