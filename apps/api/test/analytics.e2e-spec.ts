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
  seedActivity,
  isHeatmapResponse,
  isStatsResponse,
  seedDocument,
} from './helpers';
import type { Server } from 'http';

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
      const auth = await createTestAuthContext(app, {
        authId: 'dev:analytics-heatmap',
        email: 'analytics-heatmap@test.local',
      });
      // Seed some activity today
      await seedActivity('doc_added', auth.userId);
      await seedActivity('doc_opened', auth.userId);

      const response = await request(app.getHttpServer())
        .get('/api/v1/analytics/heatmap')
        .set('Cookie', auth.cookies)
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
      const auth = await createTestAuthContext(app, {
        authId: 'dev:analytics-stats',
        email: 'analytics-stats@test.local',
      });
      // Seed a document to affect document stats
      await seedDocument({ title: 'Stats Doc', userId: auth.userId });

      // Seed activity for streak calculation (today and yesterday)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await seedActivity('doc_added', auth.userId, yesterday);
      await seedActivity('doc_added', auth.userId, new Date());

      const response = await request(app.getHttpServer())
        .get('/api/v1/analytics/stats')
        .set('Cookie', auth.cookies)
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
