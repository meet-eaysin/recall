'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, X } from 'lucide-react';
import { OmniBox } from './omni-box';
import { HomeContent } from '@/features/home/components/home-page';
import { useThreadStream } from './thread-stream-context';
import { useSearchChat } from '@/features/search/hooks';
import { searchApi } from '@/features/search/api';
import { QUERY_KEYS } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import { DocumentDetailView } from '@/features/library/components/document-detail-view';
import {
  Drawer,
  DrawerPopup,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { formatDistanceToNow } from 'date-fns';
import { Chat } from '@/components/ai/chat';
import type { Message } from '@/components/ai/chat-message';
import { PageContainer } from './page-container';

export function WorkspacePage() {
  const threadStream = useThreadStream();
  const activeStream = threadStream.activeStream;

  if (activeStream) return <InlineChat />;

  return (
    <PageContainer>
      <OmniBox />

      <section className="space-y-4 pt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground">
            Your Daily Synthesis
          </h2>
        </div>
        <HomeContent />
      </section>
    </PageContainer>
  );
}

function InlineChat() {
  const queryClient = useQueryClient();
  const threadStream = useThreadStream();
  const activeStream = threadStream.activeStream;
  const conversationId = activeStream?.conversationId ?? null;

  const [question, setQuestion] = React.useState('');
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [streamingAnswer, setStreamingAnswer] = React.useState('');
  const [streamingQuestion, setStreamingQuestion] = React.useState('');
  const [previewId, setPreviewId] = React.useState<string | null>(null);
  const followUpAbortRef = React.useRef<AbortController | null>(null);

  const [error, setError] = React.useState<string | null>(null);

  const { data: conversation } = useSearchChat(conversationId);

  const goBack = () => {
    threadStream.clearStream();
    window.history.replaceState(null, '', '/app');
  };

  const submitFollowUp = async () => {
    const trimmed = question.trim();
    if (!trimmed || isStreaming || !conversationId) return;

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
        { conversationId, question: trimmed },
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
                queryKey: QUERY_KEYS.SEARCH.chat(conversationId),
              });
              queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.SEARCH.chats(),
              });
            } else if (event.type === 'done') {
              queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.SEARCH.chat(conversationId),
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

  const stopGeneration = () => {
    if (followUpAbortRef.current) {
      followUpAbortRef.current.abort();
      followUpAbortRef.current = null;
    }
    threadStream.abortStream();
    setIsStreaming(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestion(e.target.value);
  };

  const handleSubmit = (event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.();
    if (question.trim()) {
      void submitFollowUp();
    }
  };

  // Build the message list
  const persistedMessages = conversation?.messages ?? [];
  const showInitialStream =
    activeStream &&
    (activeStream.isStreaming ||
      activeStream.answer.length > 0 ||
      !!activeStream.error);
  // If conversation has messages AND stream is done, show persisted only
  const usePersistedOnly =
    persistedMessages.length > 0 && activeStream && !activeStream.isStreaming;

  const messages: Message[] = React.useMemo(() => {
    const list: Message[] = [];

    // 1. Add persisted messages
    if (usePersistedOnly && conversation?.messages) {
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

    // 2. Add activeStream if it's the initial query and not yet persisted
    if (!usePersistedOnly && showInitialStream && activeStream) {
      list.push({
        id: 'initial-user',
        role: 'user',
        content: activeStream.question,
        createdAt: new Date(),
      });
      if (activeStream.answer || activeStream.error) {
        list.push({
          id: 'initial-assistant',
          role: 'assistant',
          content: activeStream.error
            ? activeStream.error
            : activeStream.answer,
        });
      }
    }

    // 3. Add followUp stream
    if (streamingQuestion || isStreaming || error) {
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
    usePersistedOnly,
    activeStream,
    showInitialStream,
    streamingQuestion,
    streamingAnswer,
    isStreaming,
    error,
  ]);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  return (
    <PageContainer isFullHeight ref={scrollRef} className="px-0 py-0 pb-0 md:pb-0 lg:pb-0 min-h-[calc(100svh-0.5rem)]">
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="sticky top-0 z-20 w-full bg-background/80 backdrop-blur-md">
          <div className="max-w-4xl mx-auto px-4 md:px-8">
            <header className="flex items-center gap-4 py-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={goBack}
                className="shrink-0"
              >
                <ArrowLeft className="size-4" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg font-bold tracking-tight truncate">
                  {conversation?.title ||
                    activeStream?.question ||
                    'New Thread'}
                </h1>
                {conversation && (
                  <p className="text-xs text-muted-foreground">
                    Started{' '}
                    {formatDistanceToNow(new Date(conversation.createdAt))} ago
                  </p>
                )}
              </div>
            </header>
          </div>
        </div>

        {/* Messages and Input replacing manual blocks */}
        <div className="flex-1 flex flex-col">
          <Chat
            messages={messages}
            input={question}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isGenerating={isStreaming || !!activeStream?.isStreaming}
            onSourceClick={setPreviewId}
            stop={stopGeneration}
            scrollRef={scrollRef}
          />
        </div>
      </div>

      {/* Source Preview Drawer */}
      <Drawer
        position="right"
        open={!!previewId}
        onOpenChange={(open) => !open && setPreviewId(null)}
      >
        <DrawerPopup className="h-full sm:max-w-2xl p-0">
          <DrawerHeader className="p-4 border-b flex flex-row items-center justify-between">
            <DrawerTitle className="text-lg font-semibold">
              Document Preview
            </DrawerTitle>
            <DrawerClose
              render={
                <Button variant="ghost" size="icon" className="rounded-full">
                  <X className="size-4" />
                  <span className="sr-only">Close</span>
                </Button>
              }
            />
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto p-4">
            {previewId && (
              <DocumentDetailView id={previewId} isCompact={true} />
            )}
          </div>
        </DrawerPopup>
      </Drawer>
    </PageContainer>
  );
}
