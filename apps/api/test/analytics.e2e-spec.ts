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
  seedActivity,
  isHeatmapResponse,
  isStatsResponse,
  seedDocument,
} from './helpers';
import { Server } from 'http';

describe('Analytics (e2e)', () => {
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

  describe('GET /analytics/heatmap', () => {
    it('should return heatmap data with seeded activities', async () => {
      // Seed some activity today
      await seedActivity('doc_added');
      await seedActivity('doc_opened');

      const response = await request(app.getHttpServer())
        .get('/api/v1/analytics/heatmap')
        .set('x-user-id', TEST_USER_ID)
        .expect(200);

      const { body } = response;
      if (isHeatmapResponse(body)) {
        expect(body.success).toBe(true);
        expect(body.data.heatmap.length).toBeGreaterThan(0);

        const todayStr = new Date().toISOString().split('T')[0];
        const todayData = body.data.heatmap.find((h) => h.date === todayStr);
        expect(todayData).toBeDefined();
        if (todayData) {
          expect(todayData.count).toBeGreaterThanOrEqual(2);
          expect(todayData.breakdown.doc_added).toBe(1);
          expect(todayData.breakdown.doc_opened).toBe(1);
        }
      } else {
        throw new Error('Response body does not match HeatmapResponse shape');
      }
    });
  });

  describe('GET /analytics/stats', () => {
    it('should return aggregate stats spanning multiple days', async () => {
      // Seed a document to affect document stats
      await seedDocument({ title: 'Stats Doc' });

      // Seed activity for streak calculation (today and yesterday)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await seedActivity('doc_added', TEST_USER_ID, yesterday);
      await seedActivity('doc_added', TEST_USER_ID, new Date());

      const response = await request(app.getHttpServer())
        .get('/api/v1/analytics/stats')
        .set('x-user-id', TEST_USER_ID)
        .expect(200);

      const { body } = response;
      if (isStatsResponse(body)) {
        expect(body.success).toBe(true);
        expect(body.data.totalDocuments).toBeGreaterThanOrEqual(1);
        expect(body.data.currentStreak).toEqual(2);
      } else {
        throw new Error('Response body does not match StatsResponse shape');
      }
    });
  });
});
