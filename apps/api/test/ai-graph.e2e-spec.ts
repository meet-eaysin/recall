import { describe, it, beforeAll, afterAll, expect, afterEach } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupApp, teardownApp, cleanupDatabase } from './setup';
import {
  TEST_USER_ID,
  seedGraphNode,
  seedGraphEdge,
  isFullGraphResponse,
  isDocumentSubgraphResponse,
  generateId,
} from './helpers';
import { Server } from 'http';

describe('AI Knowledge Graph (e2e)', () => {
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

  it('should retrieve the full knowledge graph with seeded nodes', async () => {
    await seedGraphNode('Artificial Intelligence', 'Concept');

    const response = await request(app.getHttpServer())
      .get('/api/v1/graph')
      .set('x-user-id', TEST_USER_ID)
      .expect(200);

    if (isFullGraphResponse(response.body)) {
      expect(response.body.success).toBe(true);
      expect(response.body.data.nodes.length).toBeGreaterThan(0);
    } else {
      throw new Error('Response does not match FullGraphResponse shape');
    }
  });

  it('should create and link nodes via edges', async () => {
    const nodeAId = await seedGraphNode('Machine Learning', 'Concept');
    const nodeBId = await seedGraphNode('Deep Learning', 'Concept');
    await seedGraphEdge(nodeAId, nodeBId, 'specializes');

    const response = await request(app.getHttpServer())
      .get('/api/v1/graph')
      .set('x-user-id', TEST_USER_ID)
      .expect(200);

    if (isFullGraphResponse(response.body)) {
      const hasEdge = response.body.data.edges.some(e => e.relationType === 'specializes');
      expect(hasEdge).toBe(true);
      expect(response.body.data.nodes.length).toBe(2);
    } else {
      throw new Error('Response does not match FullGraphResponse shape');
    }
  });

  it('should retrieve document-specific subgraph', async () => {
    const docId = generateId();
    await seedGraphNode('Project Plan', 'Document', docId);

    const response = await request(app.getHttpServer())
      .get(`/api/v1/graph/document/${docId}`)
      .set('x-user-id', TEST_USER_ID)
      .expect(200);

    if (isDocumentSubgraphResponse(response.body)) {
      expect(response.body.success).toBe(true);
      expect(response.body.data.node.label).toBe('Project Plan');
    } else {
      throw new Error('Response does not match DocumentSubgraphResponse shape');
    }
  });

  it('should return 404 for non-existent document subgraph', async () => {
    const fakeId = generateId();
    await request(app.getHttpServer())
      .get(`/api/v1/graph/document/${fakeId}`)
      .set('x-user-id', TEST_USER_ID)
      .expect(404);
  });
});
