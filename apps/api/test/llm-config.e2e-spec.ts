import { describe, it, beforeAll, afterAll, expect, afterEach } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupApp, teardownApp, cleanupDatabase } from './setup';
import { 
  TEST_USER_ID, 
  seedLLMConfig,
  isLLMConfigResponse
} from './helpers';
import { Server } from 'http';

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
      const payload = {
        provider: 'openai',
        chatModel: 'gpt-4',
        embeddingModel: 'text-embedding-3-small',
        apiKey: 'sk-12345',
      };

      const response = await request(app.getHttpServer())
        .put('/api/v1/llm-config')
        .set('x-user-id', TEST_USER_ID)
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
      await request(app.getHttpServer())
        .get('/api/v1/llm-config')
        .set('x-user-id', TEST_USER_ID)
        .expect(404);
    });

    it('should return config if seeded', async () => {
      await seedLLMConfig();

      const response = await request(app.getHttpServer())
        .get('/api/v1/llm-config')
        .set('x-user-id', TEST_USER_ID)
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
      const payload = {
        provider: 'openai',
        chatModel: 'gpt-4',
        embeddingModel: 'text-embedding-3-small',
        apiKey: 'sk-12345',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/llm-config/validate')
        .set('x-user-id', TEST_USER_ID)
        .send(payload)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('DELETE /llm-config', () => {
    it('should delete existing config', async () => {
      await seedLLMConfig();

      await request(app.getHttpServer())
        .delete('/api/v1/llm-config')
        .set('x-user-id', TEST_USER_ID)
        .expect(204);

      // Verify it's gone
      await request(app.getHttpServer())
        .get('/api/v1/llm-config')
        .set('x-user-id', TEST_USER_ID)
        .expect(404);
    });
  });
});
