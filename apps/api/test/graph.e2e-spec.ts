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
  seedGraphNode,
  seedGraphEdge,
  isFullGraphResponse,
  isDocumentSubgraphResponse,
  isRebuildGraphResponse,
} from './helpers';
import type { Server } from 'http';

describe('Graph (e2e)', () => {
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

  describe('GET /graph', () => {
    it('should return the full knowledge graph', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:graph-full',
        email: 'graph-full@test.local',
      });
      // Seed root node (Concept)
      const rootId = await seedGraphNode(
        'Artificial Intelligence',
        'Concept',
        undefined,
        auth.userId,
      );

      // Seed document node
      const docId = await seedDocument({
        title: 'AI Research Paper',
        userId: auth.userId,
      });
      const docNodeId = await seedGraphNode(
        'AI Research Paper',
        'Document',
        docId,
        auth.userId,
      );

      // Link them
      await seedGraphEdge(docNodeId, rootId, 'mentions', 1.0, auth.userId);

      const response = await request(app.getHttpServer())
        .get('/api/v1/graph')
        .set('Cookie', auth.cookies)
        .expect(200);

      if (isFullGraphResponse(response.body)) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.nodes.length).toBeGreaterThanOrEqual(2);
        expect(response.body.data.edges.length).toBeGreaterThanOrEqual(1);

        // Root node ID check
        expect(typeof response.body.data.rootNodeId).toBe('string');
      } else {
        throw new Error('Graph full response mismatch');
      }
    });

    it('should return empty arrays when no graph exists', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:graph-empty',
        email: 'graph-empty@test.local',
      });
      const response = await request(app.getHttpServer())
        .get('/api/v1/graph')
        .set('Cookie', auth.cookies)
        .expect(200);

      if (isFullGraphResponse(response.body)) {
        expect(response.body.data.nodes).toEqual([]);
        expect(response.body.data.edges).toEqual([]);
      } else {
        throw new Error('Graph empty response mismatch');
      }
    });
  });

  describe('GET /graph/document/:docId', () => {
    it('should return the subgraph for a specific document', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:graph-subgraph',
        email: 'graph-subgraph@test.local',
      });
      const docId = await seedDocument({
        title: 'Subgraph Doc',
        userId: auth.userId,
      });
      const docNodeId = await seedGraphNode(
        'Subgraph Doc',
        'Document',
        docId,
        auth.userId,
      );

      const conceptId1 = await seedGraphNode(
        'Machine Learning',
        'Concept',
        undefined,
        auth.userId,
      );
      const conceptId2 = await seedGraphNode(
        'Deep Learning',
        'Concept',
        undefined,
        auth.userId,
      );

      await seedGraphEdge(docNodeId, conceptId1, 'mentions', 0.8, auth.userId);
      await seedGraphEdge(docNodeId, conceptId2, 'mentions', 0.9, auth.userId);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/graph/document/${docId}`)
        .set('Cookie', auth.cookies)
        .expect(200);

      if (isDocumentSubgraphResponse(response.body)) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.node.documentId).toBe(docId);
        expect(response.body.data.directEdges.length).toBe(2);
        expect(response.body.data.neighborNodes.length).toBe(2);
      } else {
        throw new Error('Document subgraph response mismatch');
      }
    });

    it('should return 404 for nonexistent document subgraph', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:graph-missing',
        email: 'graph-missing@test.local',
      });
      const fakeDocId = '507f1f77bcf86cd799439011';

      await request(app.getHttpServer())
        .get(`/api/v1/graph/document/${fakeDocId}`)
        .set('Cookie', auth.cookies)
        .expect(404);
    });
  });

  describe('POST /graph/rebuild/:docId', () => {
    it('should trigger graph rebuild successfully', async () => {
      const auth = await createTestAuthContext(app, {
        authId: 'dev:graph-rebuild',
        email: 'graph-rebuild@test.local',
      });
      const docId = await seedDocument({
        title: 'Rebuild Doc',
        userId: auth.userId,
      });

      const response = await request(app.getHttpServer())
        .post(`/api/v1/graph/rebuild/${docId}`)
        .set('Cookie', auth.cookies)
        .expect(202);

      if (isRebuildGraphResponse(response.body)) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBe('triggered');
      } else {
        throw new Error('Rebuild graph response mismatch');
      }
    });
  });
});
