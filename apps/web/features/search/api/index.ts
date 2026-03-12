import { apiGet, apiPost, ApiError, requestWithAuth } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import type {
  AskInput,
  AskStreamEvent,
  SearchChatConversation,
  SearchChatSummary,
  SearchFilters,
  SearchResultsResponse,
} from '../types';

function buildQueryString(
  params: Record<string, string | number | undefined | string[]>,
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item) searchParams.append(key, item);
      });
      return;
    }

    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

async function parseError(response: Response): Promise<ApiError> {
  let message = `Request failed with status ${response.status}`;

  try {
    const body = (await response.json()) as { message?: string };
    if (typeof body.message === 'string') {
      message = body.message;
    }
  } catch {
    // Preserve the fallback message if the response is not JSON.
  }

  return new ApiError(message, response.status);
}

export const searchApi = {
  ask: (body: AskInput) => apiPost(API_ENDPOINTS.SEARCH.ASK, { body }),

  getChat: async (id: string) => {
    const response = await apiGet<{ conversation: SearchChatConversation }>(
      API_ENDPOINTS.SEARCH.chat(id),
    );
    return response.conversation;
  },

  getChats: async () => {
    const response = await apiGet<{ conversations: SearchChatSummary[] }>(
      API_ENDPOINTS.SEARCH.CHATS,
    );
    return response.conversations;
  },

  search: (filters: SearchFilters) => {
    const query = buildQueryString(filters);
    return apiGet<SearchResultsResponse>(
      `${API_ENDPOINTS.SEARCH.LIST}${query}`,
    );
  },

  streamAsk: async (
    body: AskInput,
    handlers: {
      onEvent: (event: AskStreamEvent) => void;
      signal?: AbortSignal;
    },
  ) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const response = await requestWithAuth(API_ENDPOINTS.SEARCH.ASK_STREAM, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: handlers.signal,
    });

    if (!response.ok) {
      throw await parseError(response);
    }

    if (!response.body) {
      throw new ApiError('Streaming response body was empty', 500);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let receivedTerminalEvent = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          const event = JSON.parse(trimmed) as AskStreamEvent;

          if (event && typeof event === 'object' && 'type' in event) {
            if (event.type === 'done' || event.type === 'error') {
              receivedTerminalEvent = true;
            }
            handlers.onEvent(event);
          }
        }
      }

      buffer += decoder.decode();
      if (buffer.trim()) {
        const event = JSON.parse(buffer.trim()) as AskStreamEvent;
        if (event.type === 'done' || event.type === 'error') {
          receivedTerminalEvent = true;
        }
        handlers.onEvent(event);
      }
    } finally {
      if (!receivedTerminalEvent) {
        // Stream closed unexpectedly without a done/error event.
        // Prevent UI from hanging indefinitely.
        handlers.onEvent({
          type: 'error',
          message: 'Connection closed unexpectedly by the server.',
        });
      }
    }
  },
};
