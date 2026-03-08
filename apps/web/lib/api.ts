import type { ApiResponse, PaginatedResponse } from '@repo/types';

export type { ApiResponse as ApiEnvelope, PaginatedResponse };

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type ApiGetOptions = RequestInit & {
  next?: {
    revalidate?: number;
    tags?: string[];
  };
};

const rawBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
const API_BASE_URL = rawBaseUrl.endsWith('/api/v1')
  ? rawBaseUrl
  : `${rawBaseUrl}/api/v1`;
const DEV_USER_ID =
  process.env.NEXT_PUBLIC_DEV_USER_ID ?? '65f1a2b3c4d5e6f7a8b9c0d3';

async function parseEnvelope<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const errorBody = (await response.json()) as { message?: string };
      if (typeof errorBody?.message === 'string') {
        message = errorBody.message;
      }
    } catch {
      // Keep fallback message when response is not JSON.
    }
    throw new ApiError(message, response.status);
  }

  const payload = (await response.json()) as ApiResponse<T>;
  return payload.data;
}

export async function apiGet<T>(
  path: string,
  options?: ApiGetOptions,
): Promise<T> {
  const headers = new Headers(options?.headers);
  headers.set('x-user-id', DEV_USER_ID);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  return parseEnvelope<T>(response);
}

type ApiMutationOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

export async function apiPost<T>(
  path: string,
  options?: ApiMutationOptions,
): Promise<T> {
  const headers = new Headers(options?.headers);
  headers.set('x-user-id', DEV_USER_ID);
  if (options?.body instanceof FormData === false) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    method: 'POST',
    body:
      options?.body instanceof FormData
        ? options.body
        : JSON.stringify(options?.body),
    headers,
  });

  return parseEnvelope<T>(response);
}

export async function apiPatch<T>(
  path: string,
  options?: ApiMutationOptions,
): Promise<T> {
  const headers = new Headers(options?.headers);
  headers.set('x-user-id', DEV_USER_ID);
  if (options?.body instanceof FormData === false) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    method: 'PATCH',
    body:
      options?.body instanceof FormData
        ? options.body
        : JSON.stringify(options?.body),
    headers,
  });

  return parseEnvelope<T>(response);
}

export async function apiDelete<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const headers = new Headers(options?.headers);
  headers.set('x-user-id', DEV_USER_ID);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    method: 'DELETE',
    headers,
  });

  return parseEnvelope<T>(response);
}
