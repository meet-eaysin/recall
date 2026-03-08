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
  isAskResponse,
  isSearchResponse,
} from './helpers';
import type { Server } from 'http';
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

  async function seedDocumentWithChunks(
    userId: string,
    content: string,
  ): Promise<string> {
    const docId = await seedDocument({
      title: 'RAG Knowledge Doc',
      embeddingsReady: true,
      userId,
    });

    const { DocumentChunkModel } = await import('@repo/db');
    await new DocumentChunkModel({
      documentId: new Types.ObjectId(docId),
      userId: new Types.ObjectId(userId),
      index: 0,
      content,
      tokenCount: content.split(' ').length,
      metadata: { chunkIndex: 0 },
      embedding: new Array(384).fill(0),
    }).save();

    return docId;
  }

  it('should answer a question grounded in ingested content (RAG)', async () => {
    const auth = await createTestAuthContext(app, {
      authId: 'dev:ai-rag-ask',
      email: 'ai-rag-ask@test.local',
    });
    await seedDocumentWithChunks(
      auth.userId,
      'The project codename is Antigravity and it focuses on advanced propulsion systems using Carbon Nanotubes.',
    );

    const response = await request(app.getHttpServer())
      .post('/api/v1/search/ask')
      .set('Cookie', auth.cookies)
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
    const auth = await createTestAuthContext(app, {
      authId: 'dev:ai-rag-search',
      email: 'ai-rag-search@test.local',
    });
    await seedDocumentWithChunks(
      auth.userId,
      'Carbon Nanotubes provide structural integrity for the propulsion module.',
    );

    const response = await request(app.getHttpServer())
      .get('/api/v1/search')
      .query({ q: 'Carbon Nanotubes', mode: 'ai' })
      .set('Cookie', auth.cookies)
      .expect(200);

    if (isSearchResponse(response.body)) {
      expect(response.body.data.mode).toBe('ai');
    } else {
      throw new Error('Search response does not match SearchResponse shape');
    }
  });

  it('should reject an empty question with 400', async () => {
    const auth = await createTestAuthContext(app, {
      authId: 'dev:ai-rag-empty',
      email: 'ai-rag-empty@test.local',
    });
    await request(app.getHttpServer())
      .post('/api/v1/search/ask')
      .set('Cookie', auth.cookies)
      .send({ question: '' })
      .expect(400);
  });
});
