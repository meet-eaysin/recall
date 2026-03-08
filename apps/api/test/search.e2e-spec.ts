import {
  describe,
  it,
  beforeAll,
  afterAll,
  expect,
  afterEach,
} from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupApp, teardownApp, cleanupDatabase } from './setup';
import {
  createTestAuthContext,
  seedDocument,
  isSearchResponse,
  isAskResponse,
} from './helpers';
import type { Server } from 'http';
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
      const auth = await createTestAuthContext(app, {
        authId: 'dev:search-normal',
        email: 'search-normal@test.local',
      });
      await seedDocument({ title: 'Searchable Doc', userId: auth.userId });

      const response = await request(app.getHttpServer())
        .get('/api/v1/search')
        .query({ q: 'Searchable', mode: 'normal' })
        .set('Cookie', auth.cookies)
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
      const auth = await createTestAuthContext(app, {
        authId: 'dev:search-ai',
        email: 'search-ai@test.local',
      });
      await seedDocument({
        title: 'AI Search Doc',
        embeddingsReady: true,
        userId: auth.userId,
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/search')
        .query({ q: 'AI', mode: 'ai' })
        .set('Cookie', auth.cookies)
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
      const auth = await createTestAuthContext(app, {
        authId: 'dev:search-empty',
        email: 'search-empty@test.local',
      });
      await request(app.getHttpServer())
        .post('/api/v1/search/ask')
        .set('Cookie', auth.cookies)
        .send({ question: '' })
        .expect(400);
    });

    it('should answer a question from indexed documents', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:search-ask',
        email: 'search-ask@test.local',
      });
      const docId = await seedDocument({
        title: 'Knowledge Base',
        embeddingsReady: true,
        userId: auth.userId,
      });

      const { DocumentChunkModel } = await import('@repo/db');
      await new DocumentChunkModel({
        documentId: new Types.ObjectId(docId),
        userId: new Types.ObjectId(auth.userId),
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
        .set('Cookie', auth.cookies)
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
