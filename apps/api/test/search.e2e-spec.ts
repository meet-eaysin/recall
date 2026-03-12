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
        .send({ question: 'What is in the knowledge base?' });

      expect([200, 201]).toContain(response.status);

      if (isAskResponse(response.body)) {
        expect(response.body.data.answer).toBeDefined();
        expect(Array.isArray(response.body.data.sources)).toBe(true);
      } else {
        throw new Error('Ask response mismatch');
      }
    });
  });

  describe('Chat Management', () => {
    it('should list conversations without archived items by default', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:search-list',
        email: 'search-list@test.local',
      });

      const { ChatConversationModel } = await import('@repo/db');
      await ChatConversationModel.create({
        userId: auth.userId,
        title: 'Active Chat',
        isArchived: false,
      });
      await ChatConversationModel.create({
        userId: auth.userId,
        title: 'Archived Chat',
        isArchived: true,
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/search/chats')
        .set('Cookie', auth.cookies)
        .expect(200);

      expect(response.body.data.conversations).toHaveLength(1);
      expect(response.body.data.conversations[0].title).toBe('Active Chat');
    });

    it('should list archived conversations when requested', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:search-list-archived',
        email: 'search-list-archived@test.local',
      });

      const { ChatConversationModel } = await import('@repo/db');
      await ChatConversationModel.create({
        userId: auth.userId,
        title: 'Archived Chat',
        isArchived: true,
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/search/chats')
        .query({ includeArchived: 'true' })
        .set('Cookie', auth.cookies)
        .expect(200);

      expect(response.body.data.conversations).toHaveLength(1);
      expect(response.body.data.conversations[0].isArchived).toBe(true);
    });

    it('should archive a conversation', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:search-archive',
        email: 'search-archive@test.local',
      });

      const { ChatConversationModel } = await import('@repo/db');
      const chat = await ChatConversationModel.create({
        userId: auth.userId,
        title: 'To Archive',
        isArchived: false,
      });

      await request(app.getHttpServer())
        .patch(`/api/v1/search/chats/${chat._id}/archive`)
        .send({ isArchived: true })
        .set('Cookie', auth.cookies)
        .expect(200);

      const updated = await ChatConversationModel.findById(chat._id);
      expect(updated?.isArchived).toBe(true);
    });

    it('should delete a conversation', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:search-delete',
        email: 'search-delete@test.local',
      });

      const { ChatConversationModel } = await import('@repo/db');
      const chat = await ChatConversationModel.create({
        userId: auth.userId,
        title: 'To Delete',
      });

      await request(app.getHttpServer())
        .delete(`/api/v1/search/chats/${chat._id}`)
        .set('Cookie', auth.cookies)
        .expect(200);

      const deleted = await ChatConversationModel.findById(chat._id);
      expect(deleted).toBeNull();
    });

    it('should clear chat history', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:search-clear',
        email: 'search-clear@test.local',
      });

      const { ChatConversationModel } = await import('@repo/db');
      await ChatConversationModel.create({
        userId: auth.userId,
        title: 'Chat 1',
      });
      await ChatConversationModel.create({
        userId: auth.userId,
        title: 'Chat 2',
      });

      await request(app.getHttpServer())
        .delete('/api/v1/search/chats')
        .set('Cookie', auth.cookies)
        .expect(200);

      const count = await ChatConversationModel.countDocuments({
        userId: auth.userId,
      });
      expect(count).toBe(0);
    });
  });
});
