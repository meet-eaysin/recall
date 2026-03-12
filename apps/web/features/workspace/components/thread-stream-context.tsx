'use client';

import * as React from 'react';

type StreamState = {
  answer: string;
  conversationId: string;
  error: string | null;
  isStreaming: boolean;
  question: string;
};

type ThreadStreamContextValue = {
  activeStream: StreamState | null;
  clearStream: () => void;
  setStream: (state: StreamState) => void;
  updateAnswer: (chunk: string) => void;
  completeStream: () => void;
  failStream: (error: string) => void;
};

const ThreadStreamContext = React.createContext<ThreadStreamContextValue | null>(
  null,
);

export function ThreadStreamProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeStream, setActiveStream] = React.useState<StreamState | null>(
    null,
  );

  const setStream = React.useCallback((state: StreamState) => {
    setActiveStream(state);
  }, []);

  const updateAnswer = React.useCallback((chunk: string) => {
    setActiveStream((prev) => {
      if (!prev) return prev;
      return { ...prev, answer: prev.answer + chunk };
    });
  }, []);

  const completeStream = React.useCallback(() => {
    setActiveStream((prev) => {
      if (!prev) return prev;
      return { ...prev, isStreaming: false };
    });
  }, []);

  const failStream = React.useCallback((error: string) => {
    setActiveStream((prev) => {
      if (!prev) return prev;
      return { ...prev, error, isStreaming: false };
    });
  }, []);

  const clearStream = React.useCallback(() => {
    setActiveStream(null);
  }, []);

  const value = React.useMemo<ThreadStreamContextValue>(
    () => ({
      activeStream,
      clearStream,
      completeStream,
      failStream,
      setStream,
      updateAnswer,
    }),
    [activeStream, clearStream, completeStream, failStream, setStream, updateAnswer],
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
