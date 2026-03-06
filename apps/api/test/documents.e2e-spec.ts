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
  isDocumentResponse,
  isListDocumentsResponse,
  assertErrorShape,
  generateId,
} from './helpers';
import { DocumentType, DocumentStatus } from '@repo/types';
import { Server } from 'http';

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
      const payload = {
        type: DocumentType.PDF,
        source: 'https://example.com/test.pdf',
        title: 'New E2E Document',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/documents')
        .set('x-user-id', TEST_USER_ID)
        .send(payload)
        .expect(201);

      const { body } = response;
      if (isDocumentResponse(body)) {
        expect(body.success).toBe(true);
        expect(body.data.document.title).toBe(payload.title);
        expect(body.data.document.userId).toBe(TEST_USER_ID);
      } else {
        throw new Error('Response body does not match DocumentResponse shape');
      }
    });

    it('should return 400 for invalid payload (missing type)', async () => {
      const payload = {
        source: 'https://example.com/test.pdf',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/documents')
        .set('x-user-id', TEST_USER_ID)
        .send(payload)
        .expect(400);

      assertErrorShape(response.body, 400, 'VALIDATION_ERROR');
    });
  });

  describe('GET /documents', () => {
    it('should list user documents', async () => {
      // Seed a document first
      await seedDocument({ title: 'Seed List Test' });

      const response = await request(app.getHttpServer())
        .get('/api/v1/documents')
        .set('x-user-id', TEST_USER_ID)
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
      const docId = await seedDocument({ title: 'Single Doc Test' });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/documents/${docId}`)
        .set('x-user-id', TEST_USER_ID)
        .expect(200);

      const { body } = response;
      if (isDocumentResponse(body)) {
        expect(body.data.document.id).toBe(docId);
      } else {
        throw new Error('Response body does not match DocumentResponse shape');
      }
    });

    it('should return 404 for non-existent document', async () => {
      const nonExistentId = generateId();

      const response = await request(app.getHttpServer())
        .get(`/api/v1/documents/${nonExistentId}`)
        .set('x-user-id', TEST_USER_ID)
        .expect(404);

      assertErrorShape(response.body, 404, 'NOT_FOUND');
    });
  });

  describe('PATCH /documents/:id', () => {
    it('should update a document', async () => {
      const docId = await seedDocument({ title: 'Before Update' });

      const payload = {
        title: 'After Update',
        status: DocumentStatus.IN_PROCESS,
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/documents/${docId}`)
        .set('x-user-id', TEST_USER_ID)
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
      const docId = await seedDocument({ title: 'To Delete' });

      await request(app.getHttpServer())
        .delete(`/api/v1/documents/${docId}`)
        .set('x-user-id', TEST_USER_ID)
        .expect(204);

      // Verify it's gone
      await request(app.getHttpServer())
        .get(`/api/v1/documents/${docId}`)
        .set('x-user-id', TEST_USER_ID)
        .expect(404);
    });
  });
});
