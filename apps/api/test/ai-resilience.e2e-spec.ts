import { describe, it, beforeAll, afterAll } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupApp, teardownApp, cleanupDatabase } from './setup';
import { createTestAuthContext, assertErrorShape, generateId } from './helpers';
import { Server } from 'http';

describe('AI Resilience (e2e)', () => {
  let app: INestApplication<Server>;

  beforeAll(async () => {
    app = await setupApp();
    await cleanupDatabase();
  }, 30000);

  afterAll(async () => {
    await teardownApp(app);
  });

  it('should return 400 for ask with empty question', async () => {
    const auth = await createTestAuthContext(app, {
      authId: 'dev:ai-resilience-empty',
      email: 'ai-resilience-empty@test.local',
    });
    const response = await request(app.getHttpServer())
      .post('/api/v1/search/ask')
      .set('Cookie', auth.cookies)
      .send({ question: '' })
      .expect(400);

    assertErrorShape(response.body, 400, 'VALIDATION_ERROR');
  });

  it('should return 400 for ask with missing question field', async () => {
    const auth = await createTestAuthContext(app, {
      authId: 'dev:ai-resilience-missing',
      email: 'ai-resilience-missing@test.local',
    });
    const response = await request(app.getHttpServer())
      .post('/api/v1/search/ask')
      .set('Cookie', auth.cookies)
      .send({})
      .expect(400);

    assertErrorShape(response.body, 400, 'VALIDATION_ERROR');
  });

  it('should return 400 for search with empty query', async () => {
    const auth = await createTestAuthContext(app, {
      authId: 'dev:ai-resilience-query',
      email: 'ai-resilience-query@test.local',
    });
    const response = await request(app.getHttpServer())
      .get('/api/v1/search')
      .query({ q: '' })
      .set('Cookie', auth.cookies)
      .expect(400);

    assertErrorShape(response.body, 400, 'VALIDATION_ERROR');
  });

  it('should return 404 for ingestion status of non-existent document', async () => {
    const auth = await createTestAuthContext(app, {
      authId: 'dev:ai-resilience-ingestion',
      email: 'ai-resilience-ingestion@test.local',
    });
    const fakeId = generateId();
    const response = await request(app.getHttpServer())
      .get(`/api/v1/documents/${fakeId}/ingestion-status`)
      .set('Cookie', auth.cookies)
      .expect(404);

    assertErrorShape(response.body, 404, 'NOT_FOUND');
  });

  it('should return 404 for graph subgraph of non-existent document', async () => {
    const auth = await createTestAuthContext(app, {
      authId: 'dev:ai-resilience-graph',
      email: 'ai-resilience-graph@test.local',
    });
    const fakeId = generateId();
    const response = await request(app.getHttpServer())
      .get(`/api/v1/graph/document/${fakeId}`)
      .set('Cookie', auth.cookies)
      .expect(404);

    assertErrorShape(response.body, 404, 'NOT_FOUND');
  });

  it('should handle ask with invalid documentIds gracefully', async () => {
    const auth = await createTestAuthContext(app, {
      authId: 'dev:ai-resilience-docids',
      email: 'ai-resilience-docids@test.local',
    });
    await request(app.getHttpServer())
      .post('/api/v1/search/ask')
      .set('Cookie', auth.cookies)
      .send({
        question: 'What is this about?',
        documentIds: ['not-an-objectid'],
      })
      .expect(400);
  });
});
