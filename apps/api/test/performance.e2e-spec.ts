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
  seedFolder,
  isListDocumentsResponse,
} from './helpers';
import { DocumentType } from '@repo/types';
import type { Server } from 'http';

describe('Performance and Edge Cases (e2e)', () => {
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

  describe('Large Lists Pagination', () => {
    it('should handle fetching 100+ documents efficiently', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:performance-docs',
        email: 'performance-docs@test.local',
      });
      // Seed 105 documents
      const docsToSeed = Array.from({ length: 105 }).map((_, i) => ({
        title: `Bulk Doc ${i}`,
        type: DocumentType.TEXT,
        content: `Content for doc ${i}`,
        userId: auth.userId,
      }));

      await Promise.all(docsToSeed.map((d) => seedDocument(d)));

      const page1Res = await request(app.getHttpServer())
        .get('/api/v1/documents?page=1&limit=50')
        .set('Cookie', auth.cookies)
        .expect(200);

      if (isListDocumentsResponse(page1Res.body)) {
        expect(page1Res.body.data.items.length).toBe(50);
        expect(page1Res.body.data.total).toBe(105);
        expect(page1Res.body.data.page).toBe(1);
      } else {
        throw new Error('List response mismatch on page 1');
      }

      const page3Res = await request(app.getHttpServer())
        .get('/api/v1/documents?page=3&limit=50')
        .set('Cookie', auth.cookies)
        .expect(200);

      if (isListDocumentsResponse(page3Res.body)) {
        expect(page3Res.body.data.items.length).toBe(5);
        expect(page3Res.body.data.page).toBe(3);
      } else {
        throw new Error('List response mismatch on page 3');
      }
    });

    it('should handle large nested folder structures', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:performance-folders',
        email: 'performance-folders@test.local',
      });
      // Seed 50 folders in a flat list just to check limits
      const folders = Array.from({ length: 50 }).map((_, i) => `Folder ${i}`);
      await Promise.all(folders.map((f) => seedFolder(f, auth.userId)));

      const response = await request(app.getHttpServer())
        .get('/api/v1/knowledge/folders')
        .set('Cookie', auth.cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.folders)).toBe(true);
      expect(response.body.data.folders.length).toBe(50);
    });
  });

  describe('Empty Results', () => {
    it('should return valid empty response shapes (Documents)', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:performance-empty-docs',
        email: 'performance-empty-docs@test.local',
      });
      const response = await request(app.getHttpServer())
        .get('/api/v1/documents')
        .set('Cookie', auth.cookies)
        .expect(200);

      if (isListDocumentsResponse(response.body)) {
        expect(response.body.data.items).toEqual([]);
        expect(response.body.data.total).toBe(0);
      } else {
        throw new Error('Empty list response mismatch');
      }
    });

    it('should return valid empty response shapes (Folders)', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:performance-empty-folders',
        email: 'performance-empty-folders@test.local',
      });
      const response = await request(app.getHttpServer())
        .get('/api/v1/knowledge/folders')
        .set('Cookie', auth.cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.folders).toEqual([]);
    });
  });

  describe('Error Response Shapes Consistency', () => {
    it('should strictly return standardized 404 shape', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:performance-404',
        email: 'performance-404@test.local',
      });
      const response = await request(app.getHttpServer())
        .get('/api/v1/documents/000000000000000000000000')
        .set('Cookie', auth.cookies)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body).toHaveProperty('error', 'NOT_FOUND');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');
    });

    it('should strictly return standardized 400 shape for invalid UUID/ObjectId', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:performance-invalid-id',
        email: 'performance-invalid-id@test.local',
      });
      const response = await request(app.getHttpServer())
        .get('/api/v1/knowledge/folders/invalid-id')
        .set('Cookie', auth.cookies);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('statusCode');
      expect([400, 404]).toContain(response.body.statusCode);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');
    });
  });
});
