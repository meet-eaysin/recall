import { expect } from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import mongoose from 'mongoose';
import request from 'supertest';
import type { Server } from 'http';

export const TEST_USER_ID = '65f1a2b3c4d5e6f7a8b9c0d1';

export interface HealthResponse {
  success: boolean;
  data: {
    status: string;
    timestamp: string;
  };
}

export interface ErrorResponse {
  success: boolean;
  statusCode: number;
  error: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
  timestamp: string;
  path: string;
}

interface AuthSessionResponse {
  data: {
    user: {
      id: string;
      email: string | null;
    };
    session: {
      id: string;
    };
  };
}

export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

function isAuthSessionResponse(body: unknown): body is AuthSessionResponse {
  if (!isObject(body) || !isObject(body.data)) return false;
  if (!isObject(body.data.user) || !isObject(body.data.session)) return false;

  return (
    typeof body.data.user.id === 'string' &&
    (typeof body.data.user.email === 'string' ||
      body.data.user.email === null) &&
    typeof body.data.session.id === 'string'
  );
}

export function isHealthResponse(body: unknown): body is HealthResponse {
  if (!isObject(body)) return false;
  if (body.success !== true) return false;
  if (!isObject(body.data)) return false;

  const data = body.data;
  return typeof data.status === 'string' && typeof data.timestamp === 'string';
}

export function isErrorResponse(body: unknown): body is ErrorResponse {
  return (
    typeof body === 'object' &&
    body !== null &&
    'success' in body &&
    body.success === false &&
    'statusCode' in body &&
    'message' in body &&
    'error' in body &&
    'timestamp' in body &&
    'path' in body
  );
}

export function assertHealthSuccess(body: unknown): void {
  if (isHealthResponse(body)) {
    expect(body.data.status).toBe('ok');
    expect(body.data.timestamp).toEqual(expect.any(String));
  } else {
    throw new Error('Response body does not match HealthResponse shape');
  }
}

export function assertErrorShape(
  body: unknown,
  statusCode: number,
  error: string,
): void {
  if (isErrorResponse(body)) {
    expect(body.success).toBe(false);
    expect(body.statusCode).toBe(statusCode);
    expect(body.error).toBe(error);
    expect(typeof body.message).toBe('string');
    expect(typeof body.timestamp).toBe('string');
    expect(typeof body.path).toBe('string');
  } else {
    throw new Error('Response body does not match ErrorResponse shape');
  }
}

export function generateId(): string {
  return new mongoose.Types.ObjectId().toHexString();
}

export async function loginTestUser(
  app: INestApplication<Server>,
  overrides: {
    authId?: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
  } = {},
): Promise<string[]> {
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/dev/login')
    .send({
      authId: overrides.authId ?? 'dev:test-user',
      email: overrides.email ?? 'dev@test.local',
      name: overrides.name ?? 'Dev Test User',
      avatarUrl: overrides.avatarUrl,
    })
    .expect(200);

  const setCookieHeader: unknown = response.headers['set-cookie'];
  if (!isStringArray(setCookieHeader) || setCookieHeader.length === 0) {
    throw new Error('Auth response did not set session cookies');
  }

  return [...setCookieHeader];
}

export interface AuthContext {
  headers: Record<string, string>;
  userId: string;
  sessionId?: string;
  email: string | null;
  cookies?: string[];
}

export async function createTestAuthContext(
  app: INestApplication<Server>,
  overrides: {
    authId?: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
    useBypass?: boolean;
  } = {},
): Promise<AuthContext> {
  const useBypass = overrides.useBypass ?? true; // Default to bypass for speed

  if (useBypass) {
    // Generate a consistent ID based on authId or random
    const userId = overrides.authId
      ? Buffer.from(overrides.authId)
          .toString('hex')
          .slice(0, 24)
          .padEnd(24, '0')
      : generateId();

    return {
      headers: { 'x-user-id': userId },
      userId,
      email: overrides.email ?? 'dev@test.local',
    };
  }

  const cookies = await loginTestUser(app, overrides);

  const response = await request(app.getHttpServer())
    .get('/api/v1/auth/session')
    .set('Cookie', cookies)
    .expect(200);

  const body: unknown = response.body;
  if (!isAuthSessionResponse(body)) {
    throw new Error('Auth session response did not match expected shape');
  }

  return {
    headers: { Cookie: cookies.join('; ') },
    cookies,
    userId: body.data.user.id,
    sessionId: body.data.session.id,
    email: body.data.user.email,
  };
}
