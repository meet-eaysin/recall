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
  isDocumentResponse,
  isListDocumentsResponse,
  assertErrorShape,
  generateId,
} from './helpers';
import { DocumentType, DocumentStatus } from '@repo/types';
import type { Server } from 'http';

describe('Documents (e2e)', () => {
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

  describe('POST /documents', () => {
    it('should create a new document with valid payload', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:documents-create',
        email: 'documents-create@test.local',
      });
      const payload = {
        type: DocumentType.PDF,
        source: 'https://example.com/test.pdf',
        title: 'New E2E Document',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/documents')
        .set('Cookie', auth.cookies)
        .send(payload)
        .expect(201);

      const { body } = response;
      if (isDocumentResponse(body)) {
        expect(body.success).toBe(true);
        expect(body.data.document.title).toBe(payload.title);
        expect(body.data.document.userId).toBe(auth.userId);
      } else {
        throw new Error('Response body does not match DocumentResponse shape');
      }
    });

    it('should return 400 for invalid payload (missing type)', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:documents-invalid',
        email: 'documents-invalid@test.local',
      });
      const payload = {
        source: 'https://example.com/test.pdf',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/documents')
        .set('Cookie', auth.cookies)
        .send(payload)
        .expect(400);

      assertErrorShape(response.body, 400, 'VALIDATION_ERROR');
    });
  });

  describe('GET /documents', () => {
    it('should list user documents', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:documents-list',
        email: 'documents-list@test.local',
      });
      // Seed a document first
      await seedDocument({ title: 'Seed List Test', userId: auth.userId });

      const response = await request(app.getHttpServer())
        .get('/api/v1/documents')
        .set('Cookie', auth.cookies)
        .expect(200);

      const { body } = response;
      if (isListDocumentsResponse(body)) {
        expect(body.data.items.length).toBeGreaterThanOrEqual(1);
      } else {
        throw new Error(
          'Response body does not match ListDocumentsResponse shape',
        );
      }
    });
  });

  describe('GET /documents/:id', () => {
    it('should get a specific document', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:documents-get',
        email: 'documents-get@test.local',
      });
      const docId = await seedDocument({
        title: 'Single Doc Test',
        userId: auth.userId,
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/documents/${docId}`)
        .set('Cookie', auth.cookies)
        .expect(200);

      const { body } = response;
      if (isDocumentResponse(body)) {
        expect(body.data.document.id).toBe(docId);
      } else {
        throw new Error('Response body does not match DocumentResponse shape');
      }
    });

    it('should return 404 for non-existent document', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:documents-missing',
        email: 'documents-missing@test.local',
      });
      const nonExistentId = generateId();

      const response = await request(app.getHttpServer())
        .get(`/api/v1/documents/${nonExistentId}`)
        .set('Cookie', auth.cookies)
        .expect(404);

      assertErrorShape(response.body, 404, 'NOT_FOUND');
    });
  });

  describe('PATCH /documents/:id', () => {
    it('should update a document', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:documents-update',
        email: 'documents-update@test.local',
      });
      const docId = await seedDocument({
        title: 'Before Update',
        userId: auth.userId,
      });

      const payload = {
        title: 'After Update',
        status: DocumentStatus.IN_PROCESS,
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/documents/${docId}`)
        .set('Cookie', auth.cookies)
        .send(payload)
        .expect(200);

      const { body } = response;
      if (isDocumentResponse(body)) {
        expect(body.data.document.title).toBe(payload.title);
        expect(body.data.document.status).toBe(payload.status);
      } else {
        throw new Error('Response body does not match DocumentResponse shape');
      }
    });
  });

  describe('DELETE /documents/:id', () => {
    it('should delete a document', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:documents-delete',
        email: 'documents-delete@test.local',
      });
      const docId = await seedDocument({
        title: 'To Delete',
        userId: auth.userId,
      });

      await request(app.getHttpServer())
        .delete(`/api/v1/documents/${docId}`)
        .set('Cookie', auth.cookies)
        .expect(204);

      // Verify it's gone
      await request(app.getHttpServer())
        .get(`/api/v1/documents/${docId}`)
        .set('Cookie', auth.cookies)
        .expect(404);
    });
  });
});
