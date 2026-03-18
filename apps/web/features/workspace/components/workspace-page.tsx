'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { OmniBox } from './omni-box';
import { HomeContent } from '@/features/home/components/home-page';
import { useThreadStream } from './thread-stream-context';
import { useSearchChat } from '@/features/search/hooks';
import { searchApi } from '@/features/search/api';
import { QUERY_KEYS } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DocumentDetailView } from '@/features/library/components/document-detail-view';
import {
  Drawer,
  DrawerContent,
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

  return (
    <PageContainer isFullHeight>
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center gap-4 pb-4">
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
              {conversation?.title || activeStream?.question || 'New Thread'}
            </h1>
            {conversation && (
              <p className="text-xs text-muted-foreground">
                Started {formatDistanceToNow(new Date(conversation.createdAt))}{' '}
                ago
              </p>
            )}
          </div>
        </header>

        {/* Messages and Input replacing manual blocks */}
        <div className="flex-1 overflow-hidden pb-4 flex flex-col">
          <Chat
            messages={messages}
            input={question}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isGenerating={isStreaming || !!activeStream?.isStreaming}
            onSourceClick={setPreviewId}
            stop={stopGeneration}
          />
        </div>
      </div>

      {/* Source Preview Drawer */}
      <Drawer
        position="right"
        open={!!previewId}
        onOpenChange={(open) => !open && setPreviewId(null)}
      >
        <DrawerContent className="h-full sm:max-w-2xl">
          <DrawerHeader className="border-b flex flex-row items-center justify-between">
            <DrawerTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Document Preview
            </DrawerTitle>
            <DrawerClose>
              <Button variant="ghost" size="sm">
                Close
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6">
                {previewId && <DocumentDetailView id={previewId} />}
              </div>
            </ScrollArea>
          </div>
        </DrawerContent>
      </Drawer>
    </PageContainer>
  );
}
