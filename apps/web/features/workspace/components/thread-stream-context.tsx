'use client';

import * as React from 'react';

export type StreamState = {
  answer: string;
  conversationId: string;
  error: string | null;
  isStreaming: boolean;
  question: string;
};

type ThreadStreamContextValue = {
  activeStream: StreamState | null;
  activeAbortSignal: AbortSignal | null;
  clearStream: () => void;
  setStream: (state: StreamState) => AbortSignal;
  updateStream: (partial: Partial<StreamState>) => void;
  updateAnswer: (chunk: string) => void;
  completeStream: () => void;
  failStream: (error: string) => void;
  abortStream: () => void;
};

const ThreadStreamContext =
  React.createContext<ThreadStreamContextValue | null>(null);

export function ThreadStreamProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeStream, setActiveStream] = React.useState<StreamState | null>(
    null,
  );
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const setStream = React.useCallback((state: StreamState) => {
    // Abort any existing stream before starting a new one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setActiveStream(state);
    return controller.signal;
  }, []);

  const updateAnswer = React.useCallback((chunk: string) => {
    setActiveStream((prev) => {
      if (!prev) return prev;
      return { ...prev, answer: prev.answer + chunk };
    });
  }, []);

  const updateStream = React.useCallback((partial: Partial<StreamState>) => {
    setActiveStream((prev) => {
      if (!prev) return prev;
      return { ...prev, ...partial };
    });
  }, []);

  const completeStream = React.useCallback(() => {
    abortControllerRef.current = null;
    setActiveStream((prev) => {
      if (!prev) return prev;
      return { ...prev, isStreaming: false };
    });
  }, []);

  const failStream = React.useCallback((error: string) => {
    abortControllerRef.current = null;
    setActiveStream((prev) => {
      if (!prev) return prev;
      return { ...prev, error, isStreaming: false };
    });
  }, []);

  const clearStream = React.useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setActiveStream(null);
  }, []);

  const abortStream = React.useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setActiveStream((prev) => {
      if (!prev) return prev;
      return { ...prev, isStreaming: false };
    });
  }, []);

  const value = React.useMemo<ThreadStreamContextValue>(
    () => ({
      activeStream,
      activeAbortSignal: abortControllerRef.current?.signal ?? null,
      clearStream,
      completeStream,
      failStream,
      setStream,
      updateStream,
      updateAnswer,
      abortStream,
    }),
    [
      activeStream,
      clearStream,
      completeStream,
      failStream,
      setStream,
      updateStream,
      updateAnswer,
      abortStream,
    ],
  );

  return (
    <ThreadStreamContext.Provider value={value}>
      {children}
    </ThreadStreamContext.Provider>
  );
}

export function useThreadStream(): ThreadStreamContextValue {
  const context = React.useContext(ThreadStreamContext);
  if (!context) {
    throw new Error(
      'useThreadStream must be used within a ThreadStreamProvider',
    );
  }
  return context;
}
