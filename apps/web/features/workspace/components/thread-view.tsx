'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';

import { useSearchChat } from '@/features/search/hooks';
import { searchApi } from '@/features/search/api';
import { QUERY_KEYS } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { DocumentDetailView } from '@/features/library/components/document-detail-view';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { formatDistanceToNow } from 'date-fns';
import { useThreadStream } from './thread-stream-context';
import { Chat } from '@/components/ai/chat';
import type { Message } from '@/components/ai/chat-message';
import { PageContainer } from './page-container';

export function ThreadView() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const threadStream = useThreadStream();
  const threadId = typeof params.threadId === 'string' ? params.threadId : null;

  const [question, setQuestion] = React.useState('');
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [streamingAnswer, setStreamingAnswer] = React.useState('');
  const [streamingQuestion, setStreamingQuestion] = React.useState('');
  const [previewId, setPreviewId] = React.useState<string | null>(null);

  const { data: conversation, isLoading } = useSearchChat(threadId);

  // Check if there's an active stream from OmniBox for this thread
  const omniStream = threadStream.activeStream;
  const hasOmniStream =
    omniStream !== null &&
    omniStream.conversationId === threadId &&
    (omniStream.isStreaming || omniStream.answer.length > 0);

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
      const signal = threadStream.setStream({
        answer: '',
        conversationId: threadId ?? '',
        error: null,
        isStreaming: true,
        question: trimmed,
      });

      await searchApi.streamAsk(
        {
          conversationId: threadId ?? '',
          question: trimmed,
        },
        {
          signal,
          onEvent: (event) => {
            if (event.type === 'delta') {
              setStreamingAnswer((prev) => prev + event.chunk);
              threadStream.updateAnswer(event.chunk);
            } else if (event.type === 'error') {
              console.error(event.message);
              setError(event.message);
              setIsStreaming(false);
              threadStream.failStream(event.message);
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
              threadStream.completeStream();
            }
          },
        },
      );
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : String(error);
      setError(msg);
      setIsStreaming(false);
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

  const showOmniStream = hasOmniStream && omniStream;
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
    threadStream.abortStream();
    setIsStreaming(false);
  };

  if (isLoading && !hasOmniStream) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-8 py-8 px-4 md:px-8 mt-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <PageContainer isFullHeight>
      <div className="flex flex-col flex-1 h-full w-full min-h-0">
        {/* Header */}
        <header className="flex items-center gap-4 mb-6 shrink-0 pt-4 w-full max-w-4xl mx-auto px-4 md:px-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/app')}
            className="shrink-0"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight truncate">
              {conversation?.title || omniStream?.question || 'New Thread'}
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
        <div className="flex-1 overflow-hidden pb-4 flex flex-col min-h-0">
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
      </div>

      {/* Document Preview Drawer */}
      <Drawer
        direction="right"
        open={!!previewId}
        onOpenChange={(open) => !open && setPreviewId(null)}
      >
        <DrawerContent className="h-full sm:max-w-2xl">
          <DrawerHeader className="border-b border-subtle flex flex-row items-center justify-between shrink-0">
            <DrawerTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Document Preview
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm" className="rounded-xl">
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
