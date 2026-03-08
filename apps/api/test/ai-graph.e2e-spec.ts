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
  seedGraphNode,
  seedGraphEdge,
  isFullGraphResponse,
  isDocumentSubgraphResponse,
  generateId,
} from './helpers';
import type { Server } from 'http';

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
    const auth = await createTestAuthContext(app, {
      authId: 'dev:ai-graph-full',
      email: 'ai-graph-full@test.local',
    });
    await seedGraphNode(
      'Artificial Intelligence',
      'Concept',
      undefined,
      auth.userId,
    );

    const response = await request(app.getHttpServer())
      .get('/api/v1/graph')
      .set('Cookie', auth.cookies)
      .expect(200);

    if (isFullGraphResponse(response.body)) {
      expect(response.body.success).toBe(true);
      expect(response.body.data.nodes.length).toBeGreaterThan(0);
    } else {
      throw new Error('Response does not match FullGraphResponse shape');
    }
  });

  it('should create and link nodes via edges', async () => {
    const auth = await createTestAuthContext(app, {
      authId: 'dev:ai-graph-edges',
      email: 'ai-graph-edges@test.local',
    });
    const nodeAId = await seedGraphNode(
      'Machine Learning',
      'Concept',
      undefined,
      auth.userId,
    );
    const nodeBId = await seedGraphNode(
      'Deep Learning',
      'Concept',
      undefined,
      auth.userId,
    );
    await seedGraphEdge(nodeAId, nodeBId, 'specializes', 1, auth.userId);

    const response = await request(app.getHttpServer())
      .get('/api/v1/graph')
      .set('Cookie', auth.cookies)
      .expect(200);

    if (isFullGraphResponse(response.body)) {
      const hasEdge = response.body.data.edges.some(
        (e) => e.relationType === 'specializes',
      );
      expect(hasEdge).toBe(true);
      expect(response.body.data.nodes.length).toBe(2);
    } else {
      throw new Error('Response does not match FullGraphResponse shape');
    }
  });

  it('should retrieve document-specific subgraph', async () => {
    const auth = await createTestAuthContext(app, {
      authId: 'dev:ai-graph-subgraph',
      email: 'ai-graph-subgraph@test.local',
    });
    const docId = generateId();
    await seedGraphNode('Project Plan', 'Document', docId, auth.userId);

    const response = await request(app.getHttpServer())
      .get(`/api/v1/graph/document/${docId}`)
      .set('Cookie', auth.cookies)
      .expect(200);

    if (isDocumentSubgraphResponse(response.body)) {
      expect(response.body.success).toBe(true);
      expect(response.body.data.node.label).toBe('Project Plan');
    } else {
      throw new Error('Response does not match DocumentSubgraphResponse shape');
    }
  });

  it('should return 404 for non-existent document subgraph', async () => {
    const auth = await createTestAuthContext(app, {
      authId: 'dev:ai-graph-missing',
      email: 'ai-graph-missing@test.local',
    });
    const fakeId = generateId();
    await request(app.getHttpServer())
      .get(`/api/v1/graph/document/${fakeId}`)
      .set('Cookie', auth.cookies)
      .expect(404);
  });
});
