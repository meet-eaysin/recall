'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useSearchChat } from '@/features/search/hooks';
import { searchApi } from '@/features/search/api';
import { QUERY_KEYS } from '@/lib/query-keys';
import { useQueryClient } from '@tanstack/react-query';
import { DocumentDetailView } from '@/features/library/components/document-detail-view';
import { ResizableDocumentPreview } from './resizable-document-preview';
import { useThreadStream } from './thread-stream-context';
import { Chat } from '@/components/ai/chat';
import type { Message } from '@/components/ai/chat-message';
import { PageContainer } from './page-container';

export function ThreadView() {
  const params = useParams();
  const queryClient = useQueryClient();
  const threadStream = useThreadStream();
  const threadId = typeof params.threadId === 'string' ? params.threadId : null;

  const [question, setQuestion] = React.useState('');
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [streamingAnswer, setStreamingAnswer] = React.useState('');
  const [streamingQuestion, setStreamingQuestion] = React.useState('');
  const [previewId, setPreviewId] = React.useState<string | null>(null);
  const followUpAbortRef = React.useRef<AbortController | null>(null);

  const { data: conversation, isLoading } = useSearchChat(threadId);

  // Check if there's an active stream from OmniBox for this thread
  const omniStream = threadStream.activeStream;
  const hasOmniStream =
    omniStream !== null &&
    omniStream.conversationId === threadId &&
    (omniStream.isStreaming ||
      omniStream.answer.length > 0 ||
      !!omniStream.error);

  // Clear the omni stream once the conversation data has been fetched
  // and the stream is complete
  React.useEffect(() => {
    if (
      omniStream &&
      !omniStream.isStreaming &&
      omniStream.conversationId === threadId &&
      conversation &&
      conversation.messages.length > 0
    ) {
      threadStream.clearStream();
    }
  }, [omniStream, conversation, threadId, threadStream]);

  const [error, setError] = React.useState<string | null>(null);

  const submitQuestion = async () => {
    const trimmed = question.trim();
    if (!trimmed || isStreaming) return;

    setIsStreaming(true);
    setStreamingAnswer('');
    setError(null);
    setStreamingQuestion(trimmed);
    setQuestion('');

    try {
      if (followUpAbortRef.current) {
        followUpAbortRef.current.abort();
      }
      const controller = new AbortController();
      followUpAbortRef.current = controller;

      await searchApi.streamAsk(
        {
          conversationId: threadId ?? '',
          question: trimmed,
        },
        {
          signal: controller.signal,
          onEvent: (event) => {
            if (event.type === 'delta') {
              setStreamingAnswer((prev) => prev + event.chunk);
            } else if (event.type === 'error') {
              console.error(event.message);
              setError(event.message);
              setIsStreaming(false);
              followUpAbortRef.current = null;
              queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.SEARCH.chat(threadId ?? ''),
              });
              queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.SEARCH.chats(),
              });
            } else if (event.type === 'done') {
              queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.SEARCH.chat(threadId ?? ''),
              });
              queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.SEARCH.chats(),
              });
              setIsStreaming(false);
              setStreamingAnswer('');
              setStreamingQuestion('');
              followUpAbortRef.current = null;
            }
          },
        },
      );
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : String(error);
      setError(msg);
      setIsStreaming(false);
      followUpAbortRef.current = null;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestion(e.target.value);
  };

  const handleSubmit = (event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.();
    if (question.trim()) {
      void submitQuestion();
    }
  };

  const showOmniStream =
    hasOmniStream && omniStream && (conversation?.messages.length ?? 0) === 0;
  const showFollowUpStream = isStreaming;

  const messages: Message[] = React.useMemo(() => {
    const list: Message[] = [];

    // 1. Add persisted messages
    if (conversation?.messages) {
      conversation.messages.forEach((msg) => {
        list.push({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          createdAt: new Date(msg.createdAt),
          sources: msg.sources
            ? msg.sources.map((s) => ({
                documentId: s.documentId,
                title: s.title,
                author: s.author,
                publishedAt: s.publishedAt,
                originalSource: s.originalSource,
              }))
            : undefined,
        });
      });
    }

    // 2. Add omni stream if active (initial query) and not already persisted
    if (showOmniStream && omniStream) {
      list.push({
        id: 'omni-user',
        role: 'user',
        content: omniStream.question,
        createdAt: new Date(),
      });
      if (omniStream.answer || omniStream.error) {
        list.push({
          id: 'omni-assistant',
          role: 'assistant',
          content: omniStream.error ? omniStream.error : omniStream.answer,
        });
      }
    }

    // 3. Add followUp stream
    if (showFollowUpStream || error) {
      if (streamingQuestion) {
        list.push({
          id: 'followup-user',
          role: 'user',
          content: streamingQuestion,
          createdAt: new Date(),
        });
      }
      if (streamingAnswer || error) {
        list.push({
          id: 'followup-assistant',
          role: 'assistant',
          content: error ? error : streamingAnswer,
        });
      }
    }

    return list;
  }, [
    conversation?.messages,
    omniStream,
    showOmniStream,
    showFollowUpStream,
    streamingQuestion,
    streamingAnswer,
    error,
  ]);

  const stopGeneration = () => {
    if (followUpAbortRef.current) {
      followUpAbortRef.current.abort();
      followUpAbortRef.current = null;
    }
    threadStream.abortStream();
    setIsStreaming(false);
  };

  if (isLoading && !hasOmniStream) {
    return (
      <PageContainer
        isFullHeight
        className="absolute inset-0 px-0 py-0 overflow-hidden"
      >
        <div className="flex flex-col h-full bg-background animate-pulse">
          {/* Skeleton Messages */}
          <div className="flex-1 space-y-8 p-4 md:p-8 overflow-hidden">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="flex flex-col gap-3">
                <div className="h-4 w-3/4 rounded-full bg-muted/60" />
                <div className="h-4 w-1/2 rounded-full bg-muted/40" />
              </div>
              <div className="flex flex-col items-end gap-3">
                <div className="h-4 w-2/3 rounded-full bg-muted/60" />
                <div className="h-4 w-1/3 rounded-full bg-muted/40" />
              </div>
              <div className="flex flex-col gap-3">
                <div className="h-4 w-5/6 rounded-full bg-muted/60" />
                <div className="h-4 w-1/2 rounded-full bg-muted/40" />
                <div className="h-4 w-2/3 rounded-full bg-muted/20" />
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      isFullHeight
      className="absolute inset-0 px-0 py-0! pb-0 md:px-0 lg:px-0 md:pb-0 lg:pb-0 overflow-hidden"
    >
      {/* Main Chat Area */}
      <div className="flex flex-col h-full min-h-0 overflow-hidden w-full">
        <Chat
          messages={messages}
          input={question}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isGenerating={isStreaming || !!omniStream?.isStreaming}
          onSourceClick={setPreviewId}
          stop={stopGeneration}
        />
      </div>

      <ResizableDocumentPreview
        isOpen={!!previewId}
        onClose={() => setPreviewId(null)}
      >
        {previewId ? (
          <DocumentDetailView id={previewId} isCompact={true} />
        ) : null}
      </ResizableDocumentPreview>
    </PageContainer>
  );
}

