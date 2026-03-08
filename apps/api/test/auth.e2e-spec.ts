import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import { cleanupDatabase, setupApp, teardownApp } from './setup';
import { assertErrorShape, loginTestUser } from './helpers';

describe('Auth and Sessions (e2e)', () => {
  let app: INestApplication<Server>;

  beforeAll(async () => {
    app = await setupApp();
    await cleanupDatabase();
  }, 120000);

  afterAll(async () => {
    await teardownApp(app);
  });

  afterEach(async () => {
    await cleanupDatabase();
  }, 30000);

  it('should reject protected routes without authentication', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .expect(401);

    assertErrorShape(response.body, 401, 'UNAUTHORIZED');
  });

  it('should create a dev session and return the current session', async () => {
    const cookies = await loginTestUser(app, {
      authId: 'dev:session-user',
      email: 'session@test.local',
      name: 'Session User',
    });

    const sessionResponse = await request(app.getHttpServer())
      .get('/api/v1/auth/session')
      .set('Cookie', cookies)
      .expect(200);

    expect(sessionResponse.body.success).toBe(true);
    expect(sessionResponse.body.data.user.email).toBe('session@test.local');
    expect(sessionResponse.body.data.session.id).toEqual(expect.any(String));
  });

  it('should return the authenticated user profile from session cookies', async () => {
    const cookies = await loginTestUser(app, {
      authId: 'dev:me-user',
      email: 'me@test.local',
      name: 'Me User',
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Cookie', cookies)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe('me@test.local');
    expect(response.body.data.name).toBe('Me User');
  });

  it('should list active sessions for the authenticated user', async () => {
    const cookies = await loginTestUser(app, {
      authId: 'dev:sessions-user',
      email: 'sessions@test.local',
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/users/me/sessions')
      .set('Cookie', cookies)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].current).toBe(true);
  });

  it('should refresh an existing session', async () => {
    const cookies = await loginTestUser(app, {
      authId: 'dev:refresh-user',
      email: 'refresh@test.local',
    });

    const refreshResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookies)
      .expect(200);

    expect(refreshResponse.body.success).toBe(true);
    expect(refreshResponse.body.data.user.email).toBe('refresh@test.local');
    expect(refreshResponse.headers['set-cookie']).toEqual(expect.any(Array));
  });

  it('should logout and invalidate the current cookie session', async () => {
    const cookies = await loginTestUser(app, {
      authId: 'dev:logout-user',
      email: 'logout@test.local',
    });

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', cookies)
      .expect(200);

    const sessionResponse = await request(app.getHttpServer())
      .get('/api/v1/auth/session')
      .set('Cookie', cookies)
      .expect(401);

    assertErrorShape(sessionResponse.body, 401, 'UNAUTHORIZED');
  });
});
