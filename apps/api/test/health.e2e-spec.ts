import { describe, it, beforeAll, afterAll } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupApp, teardownApp } from './setup';
import { TEST_USER_ID, assertHealthSuccess, assertErrorShape } from './helpers';
import { Server } from 'http';

describe('AppController (e2e)', () => {
  let app: INestApplication<Server>;

  beforeAll(async () => {
    app = await setupApp();
  }, 30000);

  afterAll(async () => {
    await teardownApp(app);
  });

  describe('Health Check', () => {
    it('/api/v1/health (GET)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      assertHealthSuccess(response.body);
    });
  });

  describe('Global Configuration', () => {
    it('should have global prefix /api/v1 active', async () => {
      await request(app.getHttpServer()).get('/api/v1/health').expect(200);
      await request(app.getHttpServer()).get('/health').expect(404);
    });

    it('should have ValidationPipe active', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/documents')
        .set('x-user-id', TEST_USER_ID)
        .send({})
        .expect(400);

      assertErrorShape(response.body, 400, 'Bad Request');
    });

    it('should have Global Exception Filter active', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/non-existent-route')
        .set('x-user-id', TEST_USER_ID)
        .expect(404);

      assertErrorShape(response.body, 404, 'Not Found');
    });
  });
});
