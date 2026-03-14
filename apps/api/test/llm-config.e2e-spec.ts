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
  seedLLMConfig,
  isLLMConfigResponse,
} from './helpers';
import type { Server } from 'http';

describe('LLM Config (e2e)', () => {
  let app: INestApplication<Server>;

  beforeAll(async () => {
    app = await setupApp();
    await cleanupDatabase();
  }, 30000);

  afterAll(async () => {
    await teardownApp(app);
  }, 30000);

  afterEach(async () => {
    await cleanupDatabase();
  }, 30000);

  describe('PATCH /user/settings/llm', () => {
    it('should update LLM config', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:llm-config-update',
        email: 'llm-config-update@test.local',
      });
      const payload = {
        providerId: 'openai',
        modelId: 'gpt-4o-mini',
        useSystemDefault: false,
        apiKey: 'sk-12345',
      };

      const response = await request(app.getHttpServer())
        .patch('/api/v1/user/settings/llm')
        .set(auth.headers)
        .send(payload)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /user/settings/llm', () => {
    it('should return registry and default config', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:llm-config-get',
        email: 'llm-config-get@test.local',
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/user/settings/llm')
        .set(auth.headers)
        .expect(200);

      expect(response.body.data.registry).toBeDefined();
      expect(Array.isArray(response.body.data.registry)).toBe(true);
    });

    it('should return user config if seeded', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:llm-config-seeded',
        email: 'llm-config-seeded@test.local',
      });
      await seedLLMConfig(auth.userId);

      const response = await request(app.getHttpServer())
        .get('/api/v1/user/settings/llm')
        .set(auth.headers)
        .expect(200);

      if (isLLMConfigResponse(response.body)) {
        expect(response.body.data.config?.providerId).toBe('openai');
      } else {
        throw new Error('Get LLM config response mismatch');
      }
    });
  });

  describe('POST /user/settings/llm/test', () => {
    it('should test connection', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:llm-config-test',
        email: 'llm-config-test@test.local',
      });
      const payload = {
        providerId: 'openai',
        modelId: 'gpt-4o-mini',
        useSystemDefault: false,
        apiKey: 'sk-12345',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/user/settings/llm/test')
        .set(auth.headers)
        .send(payload);

      expect(response.body).toBeDefined();
    });
  });
});
