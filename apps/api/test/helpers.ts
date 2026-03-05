import { expect } from '@jest/globals';

export const TEST_USER_ID = '65f1a2b3c4d5e6f7a8b9c0d1';

export interface HealthResponse {
  status: string;
  timestamp: string;
}

export interface ErrorResponse {
  statusCode: number;
  message: string | string[] | Record<string, unknown>;
  error: string;
}

export function isHealthResponse(body: unknown): body is HealthResponse {
  return (
    typeof body === 'object' &&
    body !== null &&
    'status' in body &&
    'timestamp' in body
  );
}

export function isErrorResponse(body: unknown): body is ErrorResponse {
  return (
    typeof body === 'object' &&
    body !== null &&
    'statusCode' in body &&
    'message' in body &&
    'error' in body
  );
}

/**
 * Helper to assert success health response without type assertions
 */
export function assertHealthSuccess(body: unknown): void {
  if (isHealthResponse(body)) {
    expect(body.status).toBe('ok');
    expect(body.timestamp).toEqual(expect.any(String));
  } else {
    throw new Error('Response body does not match HealthResponse shape');
  }
}

/**
 * Helper to assert error response without type assertions
 */
export function assertErrorShape(body: unknown, statusCode: number, error: string): void {
  if (isErrorResponse(body)) {
    expect(body.statusCode).toBe(statusCode);
    expect(body.error).toBe(error);
  } else {
    throw new Error('Response body does not match ErrorResponse shape');
  }
}
