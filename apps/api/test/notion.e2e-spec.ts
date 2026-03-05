import { describe, it, beforeAll, afterAll, expect, afterEach } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupApp, teardownApp, cleanupDatabase } from './setup';
import { 
  TEST_USER_ID, 
  seedNotionConfig,
  isNotionConfigResponse
} from './helpers';
import { Server } from 'http';

describe('Notion (e2e)', () => {
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

  describe('GET /notion/config', () => {
    it('should return 404 if not connected', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/notion/config')
        .set('x-user-id', TEST_USER_ID)
        .expect(404);
    });

    it('should return config if connected', async () => {
      await seedNotionConfig();

      const response = await request(app.getHttpServer())
        .get('/api/v1/notion/config')
        .set('x-user-id', TEST_USER_ID)
        .expect(200);

      if (isNotionConfigResponse(response.body)) {
        expect(response.body.data.workspaceId).toBe('mock-workspace');
      } else {
        throw new Error('Notion config response mismatch');
      }
    });
  });

  describe('PATCH /notion/config', () => {
    it('should update sync settings', async () => {
      await seedNotionConfig();

      const payload = {
        syncEnabled: false,
        syncDirection: 'both'
      };

      const response = await request(app.getHttpServer())
        .patch('/api/v1/notion/config')
        .set('x-user-id', TEST_USER_ID)
        .send(payload)
        .expect(200);

      expect(response.body.success).toBe(true);
      // Depending on implementation, it might return the updated config
    });
  });

  describe('DELETE /notion/config', () => {
    it('should disconnect notion', async () => {
      await seedNotionConfig();

      await request(app.getHttpServer())
        .delete('/api/v1/notion/config')
        .set('x-user-id', TEST_USER_ID)
        .expect(204);

      // Verify it's gone
      await request(app.getHttpServer())
        .get('/api/v1/notion/config')
        .set('x-user-id', TEST_USER_ID)
        .expect(404);
    });
  });
});
