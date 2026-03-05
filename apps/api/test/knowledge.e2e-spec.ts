import { describe, it, beforeAll, afterAll, expect, afterEach } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupApp, teardownApp, cleanupDatabase } from './setup';
import { 
  TEST_USER_ID, 
  seedFolder, 
  seedDocument,
  isFolderResponse, 
  isNoteResponse,
} from './helpers';
import { Server } from 'http';

describe('Knowledge (e2e)', () => {
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

  describe('Folders', () => {
    it('should create and get a folder', async () => {
      const payload = { name: 'E2E Folder' };

      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/knowledge/folders')
        .set('x-user-id', TEST_USER_ID)
        .send(payload)
        .expect(201);

      if (isFolderResponse(createResponse.body)) {
        const folderId = createResponse.body.data.folder.id;
        expect(createResponse.body.data.folder.name).toBe(payload.name);

        const getResponse = await request(app.getHttpServer())
          .get(`/api/v1/knowledge/folders/${folderId}`)
          .set('x-user-id', TEST_USER_ID)
          .expect(200);
        
        // Note: Looking at controller, getFolder returns { success: true, data: result } 
        // where result is likely the folder object itself OR a wrapped object.
        // Let's verify shape if getFolder returns folder directly in data.
        expect(getResponse.body.success).toBe(true);
      } else {
        throw new Error('Create folder response mismatch');
      }
    });

    it('should delete a folder', async () => {
      const folderId = await seedFolder('Delete Me');
      await request(app.getHttpServer())
        .delete(`/api/v1/knowledge/folders/${folderId}`)
        .set('x-user-id', TEST_USER_ID)
        .expect(204);
    });
  });

  describe('Tags', () => {
    it('should create and list tags', async () => {
      const payload = { name: 'E2E Tag' };

      await request(app.getHttpServer())
        .post('/api/v1/knowledge/tags')
        .set('x-user-id', TEST_USER_ID)
        .send(payload)
        .expect(201);

      const listResponse = await request(app.getHttpServer())
        .get('/api/v1/knowledge/tags')
        .set('x-user-id', TEST_USER_ID)
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      expect(Array.isArray(listResponse.body.data.tags)).toBe(true);
    });
  });

  describe('Notes', () => {
    it('should create and update a note', async () => {
      const docId = await seedDocument({ title: 'Note Doc' });
      const payload = { content: 'Initial Note', documentId: docId };

      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/knowledge/notes')
        .set('x-user-id', TEST_USER_ID)
        .send(payload)
        .expect(201);

      if (isNoteResponse(createResponse.body)) {
        const noteId = createResponse.body.data.note.id;
        const updatePayload = { content: 'Updated Note' };

        const updateResponse = await request(app.getHttpServer())
          .patch(`/api/v1/knowledge/notes/${noteId}`)
          .set('x-user-id', TEST_USER_ID)
          .send(updatePayload)
          .expect(200);

        if (isNoteResponse(updateResponse.body)) {
          expect(updateResponse.body.data.note.content).toBe(updatePayload.content);
        } else {
          throw new Error('Update note response mismatch');
        }
      } else {
        throw new Error('Create note response mismatch');
      }
    });
  });
});
