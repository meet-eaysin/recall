import { describe, it, beforeAll, afterAll, expect, afterEach } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupApp, teardownApp, cleanupDatabase } from './setup';
import { 
  TEST_USER_ID, 
  seedDocument,
  seedGraphNode,
  seedGraphEdge,
  isFullGraphResponse,
  isDocumentSubgraphResponse,
  isRebuildGraphResponse
} from './helpers';
import { Server } from 'http';

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
      // Seed root node (Concept)
      const rootId = await seedGraphNode('Artificial Intelligence', 'Concept');
      
      // Seed document node
      const docId = await seedDocument({ title: 'AI Research Paper' });
      const docNodeId = await seedGraphNode('AI Research Paper', 'Document', docId);

      // Link them
      await seedGraphEdge(docNodeId, rootId, 'mentions', 1.0);

      const response = await request(app.getHttpServer())
        .get('/api/v1/graph')
        .set('x-user-id', TEST_USER_ID)
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
      const response = await request(app.getHttpServer())
        .get('/api/v1/graph')
        .set('x-user-id', TEST_USER_ID)
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
      const docId = await seedDocument({ title: 'Subgraph Doc' });
      const docNodeId = await seedGraphNode('Subgraph Doc', 'Document', docId);
      
      const conceptId1 = await seedGraphNode('Machine Learning', 'Concept');
      const conceptId2 = await seedGraphNode('Deep Learning', 'Concept');

      await seedGraphEdge(docNodeId, conceptId1, 'mentions', 0.8);
      await seedGraphEdge(docNodeId, conceptId2, 'mentions', 0.9);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/graph/document/${docId}`)
        .set('x-user-id', TEST_USER_ID)
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
      const fakeDocId = '507f1f77bcf86cd799439011';
      
      await request(app.getHttpServer())
        .get(`/api/v1/graph/document/${fakeDocId}`)
        .set('x-user-id', TEST_USER_ID)
        .expect(404);
    });
  });

  describe('POST /graph/rebuild/:docId', () => {
    it('should trigger graph rebuild successfully', async () => {
      const docId = await seedDocument({ title: 'Rebuild Doc' });
      
      const response = await request(app.getHttpServer())
        .post(`/api/v1/graph/rebuild/${docId}`)
        .set('x-user-id', TEST_USER_ID)
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
