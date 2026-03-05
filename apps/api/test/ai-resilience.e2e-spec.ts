import { describe, it, beforeAll, afterAll } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupApp, teardownApp, cleanupDatabase } from './setup';
import { TEST_USER_ID, assertErrorShape, generateId } from './helpers';
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
    const response = await request(app.getHttpServer())
      .post('/api/v1/search/ask')
      .set('x-user-id', TEST_USER_ID)
      .send({ question: '' })
      .expect(400);

    assertErrorShape(response.body, 400, 'VALIDATION_ERROR');
  });

  it('should return 400 for ask with missing question field', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/search/ask')
      .set('x-user-id', TEST_USER_ID)
      .send({})
      .expect(400);

    assertErrorShape(response.body, 400, 'VALIDATION_ERROR');
  });

  it('should return 400 for search with empty query', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/search')
      .query({ q: '' })
      .set('x-user-id', TEST_USER_ID)
      .expect(400);

    assertErrorShape(response.body, 400, 'VALIDATION_ERROR');
  });

  it('should return 404 for ingestion status of non-existent document', async () => {
    const fakeId = generateId();
    const response = await request(app.getHttpServer())
      .get(`/api/v1/documents/${fakeId}/ingestion-status`)
      .set('x-user-id', TEST_USER_ID)
      .expect(404);

    assertErrorShape(response.body, 404, 'NOT_FOUND');
  });

  it('should return 404 for graph subgraph of non-existent document', async () => {
    const fakeId = generateId();
    const response = await request(app.getHttpServer())
      .get(`/api/v1/graph/document/${fakeId}`)
      .set('x-user-id', TEST_USER_ID)
      .expect(404);

    assertErrorShape(response.body, 404, 'NOT_FOUND');
  });

  it('should handle ask with invalid documentIds gracefully', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/search/ask')
      .set('x-user-id', TEST_USER_ID)
      .send({ question: 'What is this about?', documentIds: ['not-an-objectid'] })
      .expect(400);
  });
});
