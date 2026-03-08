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
  seedNotionConfig,
  isNotionConfigResponse,
} from './helpers';
import type { Server } from 'http';

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
      const auth = await createTestAuthContext(app, {
        authId: 'dev:notion-missing',
        email: 'notion-missing@test.local',
      });
      await request(app.getHttpServer())
        .get('/api/v1/notion/config')
        .set('Cookie', auth.cookies)
        .expect(404);
    });

    it('should return config if connected', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:notion-config',
        email: 'notion-config@test.local',
      });
      await seedNotionConfig(auth.userId);

      const response = await request(app.getHttpServer())
        .get('/api/v1/notion/config')
        .set('Cookie', auth.cookies)
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
      const auth = await createTestAuthContext(app, {
        authId: 'dev:notion-update',
        email: 'notion-update@test.local',
      });
      await seedNotionConfig(auth.userId);

      const payload = {
        syncEnabled: false,
        syncDirection: 'both',
      };

      const response = await request(app.getHttpServer())
        .patch('/api/v1/notion/config')
        .set('Cookie', auth.cookies)
        .send(payload)
        .expect(200);

      expect(response.body.success).toBe(true);
      // Depending on implementation, it might return the updated config
    });
  });

  describe('DELETE /notion/config', () => {
    it('should disconnect notion', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:notion-delete',
        email: 'notion-delete@test.local',
      });
      await seedNotionConfig(auth.userId);

      await request(app.getHttpServer())
        .delete('/api/v1/notion/config')
        .set('Cookie', auth.cookies)
        .expect(204);

      // Verify it's gone
      await request(app.getHttpServer())
        .get('/api/v1/notion/config')
        .set('Cookie', auth.cookies)
        .expect(404);
    });
  });
});
