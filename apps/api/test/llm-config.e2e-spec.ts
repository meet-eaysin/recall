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
  });

  afterEach(async () => {
    await cleanupDatabase();
  });

  describe('PUT /llm-config', () => {
    it('should save a new LLM config', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:llm-config-save',
        email: 'llm-config-save@test.local',
      });
      const payload = {
        provider: 'openai',
        chatModel: 'gpt-4',
        embeddingModel: 'text-embedding-3-small',
        apiKey: 'sk-12345',
      };

      const response = await request(app.getHttpServer())
        .put('/api/v1/llm-config')
        .set('Cookie', auth.cookies)
        .send(payload)
        .expect(200);

      if (isLLMConfigResponse(response.body)) {
        expect(response.body.data.provider).toBe(payload.provider);
        expect(response.body.data.chatModel).toBe(payload.chatModel);
      } else {
        throw new Error('Save LLM config response mismatch');
      }
    });
  });

  describe('GET /llm-config', () => {
    it('should return 404 if no config exists', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:llm-config-missing',
        email: 'llm-config-missing@test.local',
      });
      await request(app.getHttpServer())
        .get('/api/v1/llm-config')
        .set('Cookie', auth.cookies)
        .expect(404);
    });

    it('should return config if seeded', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:llm-config-get',
        email: 'llm-config-get@test.local',
      });
      await seedLLMConfig(auth.userId);

      const response = await request(app.getHttpServer())
        .get('/api/v1/llm-config')
        .set('Cookie', auth.cookies)
        .expect(200);

      if (isLLMConfigResponse(response.body)) {
        expect(response.body.data.provider).toBe('openai');
      } else {
        throw new Error('Get LLM config response mismatch');
      }
    });
  });

  describe('POST /llm-config/validate', () => {
    it('should validate config capabilities', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:llm-config-validate',
        email: 'llm-config-validate@test.local',
      });
      const payload = {
        provider: 'openai',
        chatModel: 'gpt-4',
        embeddingModel: 'text-embedding-3-small',
        apiKey: 'sk-12345',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/llm-config/validate')
        .set('Cookie', auth.cookies)
        .send(payload)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('DELETE /llm-config', () => {
    it('should delete existing config', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:llm-config-delete',
        email: 'llm-config-delete@test.local',
      });
      await seedLLMConfig(auth.userId);

      await request(app.getHttpServer())
        .delete('/api/v1/llm-config')
        .set('Cookie', auth.cookies)
        .expect(204);

      // Verify it's gone
      await request(app.getHttpServer())
        .get('/api/v1/llm-config')
        .set('Cookie', auth.cookies)
        .expect(404);
    });
  });
});
