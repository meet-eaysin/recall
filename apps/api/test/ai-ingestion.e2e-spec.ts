import { describe, it, beforeAll, afterAll, expect, afterEach } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupApp, teardownApp, cleanupDatabase } from './setup';
import {
  TEST_USER_ID,
  isDocumentResponse,
  isIngestionStatusResponse,
  assertErrorShape,
} from './helpers';
import { Server } from 'http';
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
    const filePath = path.join(__dirname, 'fixtures/documents/test.pdf');
    const response = await request(app.getHttpServer())
      .post('/api/v1/documents/upload')
      .set('x-user-id', TEST_USER_ID)
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
    const filePath = path.join(__dirname, 'fixtures/documents/test.pdf');
    const uploadResponse = await request(app.getHttpServer())
      .post('/api/v1/documents/upload')
      .set('x-user-id', TEST_USER_ID)
      .attach('file', filePath)
      .field('title', 'Status Check Doc')
      .expect(201);

    if (!isDocumentResponse(uploadResponse.body)) {
      throw new Error('Upload response does not match DocumentResponse shape');
    }
    const docId = uploadResponse.body.data.document.id;

    const statusResponse = await request(app.getHttpServer())
      .get(`/api/v1/documents/${docId}/ingestion-status`)
      .set('x-user-id', TEST_USER_ID)
      .expect(200);

    if (isIngestionStatusResponse(statusResponse.body)) {
      expect(statusResponse.body.success).toBe(true);
      expect(typeof statusResponse.body.data.embeddingsReady).toBe('boolean');
    } else {
      throw new Error('Status response does not match IngestionStatusResponse shape');
    }
  });

  it('should reject upload without a file', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/documents/upload')
      .set('x-user-id', TEST_USER_ID)
      .field('title', 'No File Doc')
      .expect(400);
  });

  it('should reject upload of invalid file type', async () => {
    const filePath = path.join(__dirname, 'fixtures/documents/sample.txt');
    const response = await request(app.getHttpServer())
      .post('/api/v1/documents/upload')
      .set('x-user-id', TEST_USER_ID)
      .attach('file', filePath)
      .field('title', 'Invalid Type Doc')
      .expect(400);

    assertErrorShape(response.body, 400, 'BAD_REQUEST');
  });
});
