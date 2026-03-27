'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { searchApi } from '@/features/search/api';
import { QUERY_KEYS } from '@/lib/query-keys';

type FollowUpStreamState = {
  error: string | null;
  isStreaming: boolean;
  question: string;
  streamingAnswer: string;
  streamingQuestion: string;
};

const initialState: FollowUpStreamState = {
  error: null,
  isStreaming: false,
  question: '',
  streamingAnswer: '',
  streamingQuestion: '',
};

export function useChatFollowUpStream(conversationId: string | null) {
  const queryClient = useQueryClient();
  const abortRef = React.useRef<AbortController | null>(null);
  const [state, setState] = React.useState<FollowUpStreamState>(initialState);

  const invalidateConversation = React.useCallback(async () => {
    if (!conversationId) {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SEARCH.chats(),
      });
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SEARCH.chat(conversationId),
      }),
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SEARCH.chats(),
      }),
    ]);
  }, [conversationId, queryClient]);

  const stop = React.useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState((current) => ({ ...current, isStreaming: false }));
  }, []);

  const handleInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const nextValue = event.target.value;
      setState((current) => ({ ...current, question: nextValue }));
    },
    [],
  );

  const submitQuestion = React.useCallback(async () => {
    const trimmed = state.question.trim();
    if (!trimmed || state.isStreaming || !conversationId) {
      return;
    }

    setState((current) => ({
      ...current,
      error: null,
      isStreaming: true,
      question: '',
      streamingAnswer: '',
      streamingQuestion: trimmed,
    }));

    try {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      await searchApi.streamAsk(
        { conversationId, question: trimmed },
        {
          signal: controller.signal,
          onEvent: (event) => {
            if (event.type === 'delta') {
              setState((current) => ({
                ...current,
                streamingAnswer: current.streamingAnswer + event.chunk,
              }));
              return;
            }

            if (event.type === 'error') {
              setState((current) => ({
                ...current,
                error: event.message,
                isStreaming: false,
              }));
              abortRef.current = null;
              void invalidateConversation();
              return;
            }

            if (event.type === 'done') {
              setState((current) => ({
                ...current,
                isStreaming: false,
                streamingAnswer: '',
                streamingQuestion: '',
              }));
              abortRef.current = null;
              void invalidateConversation();
            }
          },
        },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setState((current) => ({
        ...current,
        error: message,
        isStreaming: false,
      }));
      abortRef.current = null;
    }
  }, [conversationId, invalidateConversation, state.isStreaming, state.question]);

  const handleSubmit = React.useCallback(
    (event?: { preventDefault?: () => void }) => {
      event?.preventDefault?.();
      void submitQuestion();
    },
    [submitQuestion],
  );

  return {
    ...state,
    handleInputChange,
    handleSubmit,
    setQuestion: (question: string) =>
      setState((current) => ({ ...current, question })),
    stop,
    submitQuestion,
  };
}
