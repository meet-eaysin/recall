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
  isDocumentResponse,
  isIngestionStatusResponse,
  assertErrorShape,
} from './helpers';
import type { Server } from 'http';
import * as path from 'path';

describe('AI Ingestion (e2e)', () => {
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

  it('should upload a PDF document and return a valid document response', async () => {
    const auth = await createTestAuthContext(app, {
      authId: 'dev:ai-ingestion-upload',
      email: 'ai-ingestion-upload@test.local',
    });
    const filePath = path.join(__dirname, 'fixtures/documents/test.pdf');
    const response = await request(app.getHttpServer())
      .post('/api/v1/documents/upload')
      .set('Cookie', auth.cookies)
      .attach('file', filePath)
      .field('title', 'Ingestion E2E Doc')
      .expect(201);

    if (isDocumentResponse(response.body)) {
      expect(response.body.success).toBe(true);
      expect(response.body.data.document.title).toBe('Ingestion E2E Doc');
      expect(typeof response.body.data.document.id).toBe('string');
    } else {
      throw new Error('Upload response does not match DocumentResponse shape');
    }
  });

  it('should report ingestion status for an uploaded document', async () => {
    const auth = await createTestAuthContext(app, {
      authId: 'dev:ai-ingestion-status',
      email: 'ai-ingestion-status@test.local',
    });
    const filePath = path.join(__dirname, 'fixtures/documents/test.pdf');
    const uploadResponse = await request(app.getHttpServer())
      .post('/api/v1/documents/upload')
      .set('Cookie', auth.cookies)
      .attach('file', filePath)
      .field('title', 'Status Check Doc')
      .expect(201);

    if (!isDocumentResponse(uploadResponse.body)) {
      throw new Error('Upload response does not match DocumentResponse shape');
    }
    const docId = uploadResponse.body.data.document.id;

    const statusResponse = await request(app.getHttpServer())
      .get(`/api/v1/documents/${docId}/ingestion-status`)
      .set('Cookie', auth.cookies)
      .expect(200);

    if (isIngestionStatusResponse(statusResponse.body)) {
      expect(statusResponse.body.success).toBe(true);
      expect(typeof statusResponse.body.data.embeddingsReady).toBe('boolean');
    } else {
      throw new Error(
        'Status response does not match IngestionStatusResponse shape',
      );
    }
  });

  it('should reject upload without a file', async () => {
    const auth = await createTestAuthContext(app, {
      authId: 'dev:ai-ingestion-no-file',
      email: 'ai-ingestion-no-file@test.local',
    });
    await request(app.getHttpServer())
      .post('/api/v1/documents/upload')
      .set('Cookie', auth.cookies)
      .field('title', 'No File Doc')
      .expect(400);
  });

  it('should reject upload of invalid file type', async () => {
    const auth = await createTestAuthContext(app, {
      authId: 'dev:ai-ingestion-invalid',
      email: 'ai-ingestion-invalid@test.local',
    });
    const filePath = path.join(__dirname, 'fixtures/documents/sample.txt');
    const response = await request(app.getHttpServer())
      .post('/api/v1/documents/upload')
      .set('Cookie', auth.cookies)
      .attach('file', filePath)
      .field('title', 'Invalid Type Doc')
      .expect(400);

    assertErrorShape(response.body, 400, 'BAD_REQUEST');
  });
});
