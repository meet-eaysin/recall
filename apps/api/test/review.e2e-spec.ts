import {
  describe,
  it,
  beforeAll,
  afterAll,
  expect,
  afterEach,
} from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupApp, teardownApp, cleanupDatabase } from './setup';
import {
  TEST_USER_ID,
  seedDocument,
  seedReviewDismissal,
  isDailyReviewResponse,
  isRecommendationResponse,
} from './helpers';
import { Server } from 'http';
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
      // Seed some documents to trigger review logic
      await seedDocument({ title: 'Important Doc 1' });
      await seedDocument({ title: 'Important Doc 2' });

      const response = await request(app.getHttpServer())
        .get('/api/v1/review/daily')
        .set('x-user-id', TEST_USER_ID)
        .expect(200);

      if (isDailyReviewResponse(response.body)) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      } else {
        throw new Error('Daily review response mismatch');
      }
    });

    it('should exclude dismissed items', async () => {
      const docId = await seedDocument({ title: 'Dismissed Doc' });
      await seedReviewDismissal(docId);

      const response = await request(app.getHttpServer())
        .get('/api/v1/review/daily')
        .set('x-user-id', TEST_USER_ID)
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
      const docId = await seedDocument({ title: 'To Dismiss' });

      await request(app.getHttpServer())
        .post(`/api/v1/review/dismiss/${docId}`)
        .set('x-user-id', TEST_USER_ID)
        .expect(201); // Controller uses @Post which defaults to 201

      // Verify it's dismissed in daily review
      const response = await request(app.getHttpServer())
        .get('/api/v1/review/daily')
        .set('x-user-id', TEST_USER_ID)
        .expect(200);

      if (isDailyReviewResponse(response.body)) {
        const itemIds = response.body.data.map((item) => item.documentId);
        expect(itemIds).not.toContain(docId);
      }
    });
  });

  describe('GET /recommendations', () => {
    it('should return recommendations based on tags', async () => {
      // Seed some documents with tags
      await seedDocument({
        title: 'AI Doc',
        status: DocumentStatus.TO_READ,
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/review/recommendations')
        .set('x-user-id', TEST_USER_ID)
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
