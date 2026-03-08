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
  seedReviewDismissal,
  isDailyReviewResponse,
  isRecommendationResponse,
} from './helpers';
import type { Server } from 'http';
import { DocumentStatus } from '@repo/types';

describe('Review (e2e)', () => {
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

  describe('GET /review/daily', () => {
    it('should return review items', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:review-daily',
        email: 'review-daily@test.local',
      });
      // Seed some documents to trigger review logic
      await seedDocument({ title: 'Important Doc 1', userId: auth.userId });
      await seedDocument({ title: 'Important Doc 2', userId: auth.userId });

      const response = await request(app.getHttpServer())
        .get('/api/v1/review/daily')
        .set('Cookie', auth.cookies)
        .expect(200);

      if (isDailyReviewResponse(response.body)) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      } else {
        throw new Error('Daily review response mismatch');
      }
    });

    it('should exclude dismissed items', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:review-dismissed',
        email: 'review-dismissed@test.local',
      });
      const docId = await seedDocument({
        title: 'Dismissed Doc',
        userId: auth.userId,
      });
      await seedReviewDismissal(docId, 'document', auth.userId);

      const response = await request(app.getHttpServer())
        .get('/api/v1/review/daily')
        .set('Cookie', auth.cookies)
        .expect(200);

      if (isDailyReviewResponse(response.body)) {
        const itemIds = response.body.data.map((item) => item.documentId);
        expect(itemIds).not.toContain(docId);
      } else {
        throw new Error('Daily review response mismatch');
      }
    });
  });

  describe('POST /review/dismiss/:docId', () => {
    it('should dismiss a document from review', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:review-dismiss-route',
        email: 'review-dismiss-route@test.local',
      });
      const docId = await seedDocument({
        title: 'To Dismiss',
        userId: auth.userId,
      });

      await request(app.getHttpServer())
        .post(`/api/v1/review/dismiss/${docId}`)
        .set('Cookie', auth.cookies)
        .expect(201); // Controller uses @Post which defaults to 201

      // Verify it's dismissed in daily review
      const response = await request(app.getHttpServer())
        .get('/api/v1/review/daily')
        .set('Cookie', auth.cookies)
        .expect(200);

      if (isDailyReviewResponse(response.body)) {
        const itemIds = response.body.data.map((item) => item.documentId);
        expect(itemIds).not.toContain(docId);
      }
    });
  });

  describe('GET /recommendations', () => {
    it('should return recommendations based on tags', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:review-recommendations',
        email: 'review-recommendations@test.local',
      });
      // Seed some documents with tags
      await seedDocument({
        title: 'AI Doc',
        status: DocumentStatus.TO_READ,
        userId: auth.userId,
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/review/recommendations')
        .set('Cookie', auth.cookies)
        .expect(200);

      if (isRecommendationResponse(response.body)) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.ownedDocuments).toBeDefined();
        expect(response.body.data.suggestedTopics).toBeDefined();
      } else {
        throw new Error('Recommendations response mismatch');
      }
    });
  });
});
