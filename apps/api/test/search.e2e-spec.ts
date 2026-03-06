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
  isSearchResponse,
  isAskResponse,
} from './helpers';
import { Server } from 'http';
import { Types } from 'mongoose';

describe('Search (e2e)', () => {
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

  describe('GET /search', () => {
    it('should perform normal search', async () => {
      await seedDocument({ title: 'Searchable Doc' });

      const response = await request(app.getHttpServer())
        .get('/api/v1/search')
        .query({ q: 'Searchable', mode: 'normal' })
        .set('x-user-id', TEST_USER_ID)
        .expect(200);

      if (isSearchResponse(response.body)) {
        expect(response.body.data.mode).toBe('normal');
        expect(response.body.data.total).toBeGreaterThanOrEqual(1);
        expect(Array.isArray(response.body.data.items)).toBe(true);
      } else {
        throw new Error('Search response mismatch');
      }
    });

    it('should perform AI search', async () => {
      await seedDocument({ title: 'AI Search Doc', embeddingsReady: true });

      const response = await request(app.getHttpServer())
        .get('/api/v1/search')
        .query({ q: 'AI', mode: 'ai' })
        .set('x-user-id', TEST_USER_ID)
        .expect(200);

      if (isSearchResponse(response.body)) {
        expect(response.body.data.mode).toBe('ai');
      } else {
        throw new Error('AI search response mismatch');
      }
    });
  });

  describe('POST /search/ask', () => {
    it('should reject empty question', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/search/ask')
        .set('x-user-id', TEST_USER_ID)
        .send({ question: '' })
        .expect(400);
    });

    it('should answer a question from indexed documents', async () => {
      const docId = await seedDocument({
        title: 'Knowledge Base',
        embeddingsReady: true,
      });

      const { DocumentChunkModel } = await import('@repo/db');
      await new DocumentChunkModel({
        documentId: new Types.ObjectId(docId),
        userId: new Types.ObjectId(TEST_USER_ID),
        index: 0,
        content: 'This is the knowledge base content.',
        tokenCount: 10,
        metadata: {
          chunkIndex: 0,
        },
        embedding: new Array(384).fill(0),
      }).save();

      const response = await request(app.getHttpServer())
        .post('/api/v1/search/ask')
        .set('x-user-id', TEST_USER_ID)
        .send({ question: 'What is in the knowledge base?' })
        .expect(201);

      if (isAskResponse(response.body)) {
        expect(response.body.data.answer).toBeDefined();
        expect(Array.isArray(response.body.data.sources)).toBe(true);
      } else {
        throw new Error('Ask response mismatch');
      }
    });
  });
});
