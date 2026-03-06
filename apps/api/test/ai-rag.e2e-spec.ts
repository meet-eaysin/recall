import {
  describe,
  it,
  beforeAll,
  afterAll,
  expect,
  afterEach,
} from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupApp, teardownApp, cleanupDatabase } from './setup';
import {
  TEST_USER_ID,
  seedDocument,
  isAskResponse,
  isSearchResponse,
} from './helpers';
import { Server } from 'http';
import { Types } from 'mongoose';

describe('AI RAG & Search (e2e)', () => {
  let app: INestApplication<Server>;

  beforeAll(async () => {
    app = await setupApp();
    await cleanupDatabase();
  }, 30000);

  afterAll(async () => {
    await teardownApp(app);
  });

  afterEach(async () => {
    await cleanupDatabase();
  });

  async function seedDocumentWithChunks(content: string): Promise<string> {
    const docId = await seedDocument({
      title: 'RAG Knowledge Doc',
      embeddingsReady: true,
    });

    const { DocumentChunkModel } = await import('@repo/db');
    await new DocumentChunkModel({
      documentId: new Types.ObjectId(docId),
      userId: new Types.ObjectId(TEST_USER_ID),
      index: 0,
      content,
      tokenCount: content.split(' ').length,
      metadata: { chunkIndex: 0 },
      embedding: new Array(384).fill(0),
    }).save();

    return docId;
  }

  it('should answer a question grounded in ingested content (RAG)', async () => {
    await seedDocumentWithChunks(
      'The project codename is Antigravity and it focuses on advanced propulsion systems using Carbon Nanotubes.',
    );

    const response = await request(app.getHttpServer())
      .post('/api/v1/search/ask')
      .set('x-user-id', TEST_USER_ID)
      .send({ question: 'What is the project codename?' })
      .expect(201);

    if (isAskResponse(response.body)) {
      expect(response.body.data.answer).toBeDefined();
      expect(Array.isArray(response.body.data.sources)).toBe(true);
    } else {
      throw new Error('Ask response does not match AskResponse shape');
    }
  }, 60000);

  it('should perform semantic search with AI mode', async () => {
    await seedDocumentWithChunks(
      'Carbon Nanotubes provide structural integrity for the propulsion module.',
    );

    const response = await request(app.getHttpServer())
      .get('/api/v1/search')
      .query({ q: 'Carbon Nanotubes', mode: 'ai' })
      .set('x-user-id', TEST_USER_ID)
      .expect(200);

    if (isSearchResponse(response.body)) {
      expect(response.body.data.mode).toBe('ai');
    } else {
      throw new Error('Search response does not match SearchResponse shape');
    }
  });

  it('should reject an empty question with 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/search/ask')
      .set('x-user-id', TEST_USER_ID)
      .send({ question: '' })
      .expect(400);
  });
});
