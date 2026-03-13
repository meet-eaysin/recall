import type { ApiResponse, PaginatedResponse } from '@repo/types';
import { env } from '@/lib/env';
import { getDevUserId } from '@/lib/dev-auth';

export type { ApiResponse as ApiEnvelope, PaginatedResponse };

export interface ApiFieldErrorDetail {
  field: string;
  messages: string[];
}

export class ApiError extends Error {
  status: number;
  details?: ApiFieldErrorDetail[];

  constructor(
    message: string,
    status: number,
    details?: ApiFieldErrorDetail[],
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

type ApiGetOptions = RequestInit & {
  next?: {
    revalidate?: number;
    tags?: string[];
  };
};

export const API_BASE_URL = env.apiBaseUrl;

let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(headers: Headers): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers,
      });
      return response.ok;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function requestWithAuth(
  path: string,
  init: RequestInit,
  retryOnAuth = true,
): Promise<Response> {
  const headers = new Headers(init.headers);
  const devUserId = getDevUserId();
  if (devUserId) {
    headers.set('x-user-id', devUserId);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });

  if (response.status !== 401 || !retryOnAuth) {
    return response;
  }

  const refreshed = await refreshSession(headers);
  if (!refreshed) {
    return response;
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });
}

async function parseEnvelope<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    let details: ApiFieldErrorDetail[] | undefined;

    try {
      const errorBody = (await response.json()) as {
        message?: string;
        details?: ApiFieldErrorDetail[];
      };
      if (typeof errorBody?.message === 'string') message = errorBody.message;
      if (Array.isArray(errorBody?.details)) details = errorBody.details;
    } catch {
      // Preserve the fallback message when the response has no JSON body.
    }

    throw new ApiError(message, response.status, details);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return undefined as T;
  }

  const payload = (await response.json()) as ApiResponse<T>;
  return payload.data;
}

export async function apiGet<T>(
  path: string,
  options?: ApiGetOptions,
): Promise<T> {
  const response = await requestWithAuth(path, {
    ...options,
    headers: new Headers(options?.headers),
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
  if (options?.body instanceof FormData === false) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await requestWithAuth(path, {
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
  if (options?.body instanceof FormData === false) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await requestWithAuth(path, {
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

export async function apiPut<T>(
  path: string,
  options?: ApiMutationOptions,
): Promise<T> {
  const headers = new Headers(options?.headers);
  if (options?.body instanceof FormData === false) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await requestWithAuth(path, {
    ...options,
    method: 'PUT',
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
  const response = await requestWithAuth(path, {
    ...options,
    method: 'DELETE',
    headers: new Headers(options?.headers),
  });

  return parseEnvelope<T>(response);
}
