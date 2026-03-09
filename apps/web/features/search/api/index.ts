import { API_BASE_URL, DEV_USER_ID, apiGet, apiPost, ApiError } from '@/lib/api';
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
    return apiGet<SearchResultsResponse>(`${API_ENDPOINTS.SEARCH.LIST}${query}`);
  },

  streamAsk: async (
    body: AskInput,
    handlers: {
      onEvent: (event: AskStreamEvent) => void;
      signal?: AbortSignal;
    },
  ) => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SEARCH.ASK_STREAM}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': DEV_USER_ID,
      },
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

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        handlers.onEvent(JSON.parse(trimmed) as AskStreamEvent);
      }
    }

    buffer += decoder.decode();
    if (buffer.trim()) {
      handlers.onEvent(JSON.parse(buffer.trim()) as AskStreamEvent);
    }
  },
};
