'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Bot, SendHorizonal, ExternalLink, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useSearchChat } from '@/features/search/hooks';
import { searchApi } from '@/features/search/api';
import { QUERY_KEYS } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupTextarea } from '@/components/ui/input-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { AnswerDocument } from '@/features/search/components/answer-document';
import { DocumentDetailView } from '@/features/library/components/document-detail-view';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { formatDistanceToNow } from 'date-fns';
import { useThreadStream } from './thread-stream-context';

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
  const scrollRef = React.useRef<HTMLDivElement>(null);

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

  // Auto-scroll to bottom
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages, streamingAnswer, isStreaming, omniStream?.answer]);

  const submitQuestion = async () => {
    const trimmed = question.trim();
    if (!trimmed || isStreaming) return;

    setIsStreaming(true);
    setStreamingAnswer('');
    setError(null);
    setStreamingQuestion(trimmed);
    setQuestion('');

    try {
      await searchApi.streamAsk(
        {
          conversationId: threadId ?? '',
          question: trimmed,
        },
        {
          onEvent: (event) => {
            if (event.type === 'delta') {
              setStreamingAnswer((prev) => prev + event.chunk);
            } else if (event.type === 'error') {
              console.error(event.message);
              setError(event.message);
              setIsStreaming(false);
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SEARCH.chat(threadId ?? '') });
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SEARCH.chats() });
            } else if (event.type === 'done') {
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SEARCH.chat(threadId ?? '') });
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SEARCH.chats() });
              setIsStreaming(false);
              setStreamingAnswer('');
              setStreamingQuestion('');
            }
          },
        }
      );
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : String(error);
      setError(msg);
      setIsStreaming(false);
    }
  };

  if (isLoading && !hasOmniStream) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 py-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  // Combine persisted messages + any active streaming state
  const persistedMessages = conversation?.messages ?? [];
  const showOmniStream = hasOmniStream && omniStream;
  const showFollowUpStream = isStreaming;

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => router.push('/app')} className="shrink-0">
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">
              {conversation?.title || omniStream?.question || 'New Thread'}
            </h1>
            {conversation && (
              <p className="text-sm text-muted-foreground">
                Started {formatDistanceToNow(new Date(conversation.createdAt))} ago
              </p>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-hidden relative" ref={scrollRef}>
          <ScrollArea className="h-full pr-4">
            <div className="space-y-8 pb-24">
              {/* Persisted messages */}
              {persistedMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  sources={message.sources}
                  createdAt={message.createdAt}
                  onSourceClick={setPreviewId}
                />
              ))}

              {/* OmniBox stream (initial question) */}
              {showOmniStream && (
                <>
                  <MessageBubble
                    role="user"
                    content={omniStream.question}
                  />
                  <MessageBubble
                    role="assistant"
                    content={omniStream.answer}
                    isStreaming={omniStream.isStreaming}
                    error={omniStream.error}
                  />
                </>
              )}

              {/* Follow-up stream */}
              {(showFollowUpStream || error) && (
                <>
                  {streamingQuestion && (
                    <MessageBubble role="user" content={streamingQuestion} />
                  )}
                  <MessageBubble
                    role="assistant"
                    content={streamingAnswer}
                    isStreaming={isStreaming}
                    error={error}
                  />
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Input Area */}
        <div className="pt-4 shrink-0">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-linear-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-700" />
            <div className="relative bg-background border border-subtle rounded-2xl shadow-xl p-2 transition-all duration-300 group-focus-within:border-primary/40">
              <InputGroup data-align="block-end" className="border-0 shadow-none">
                <InputGroupTextarea
                  placeholder="Ask a follow-up..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      void submitQuestion();
                    }
                  }}
                  className="min-h-14 max-h-48 resize-none bg-transparent"
                />
                <InputGroupAddon align="block-end" className="p-1">
                  <Button
                    size="icon"
                    onClick={() => void submitQuestion()}
                    disabled={isStreaming || !question.trim() || (omniStream?.isStreaming ?? false)}
                    className="rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105"
                  >
                    <SendHorizonal className="size-4" />
                  </Button>
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground uppercase tracking-widest">
            Press Command + Enter to send
          </p>
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
            <DrawerTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Document Preview</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm" className="rounded-xl">Close</Button>
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
    </>
  );
}

function MessageBubble({
  role,
  content,
  sources,
  createdAt,
  isStreaming: bubbleStreaming,
  error,
  onSourceClick,
}: {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ documentId: string; title: string; author: string | null; publishedAt: string | null; originalSource: string | null }>;
  createdAt?: string;
  isStreaming?: boolean;
  error?: string | null;
  onSourceClick?: (id: string) => void;
}) {
  return (
    <div className={cn(
      "group relative flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500",
      role === 'user' ? "items-end" : "items-start"
    )}>
      <div className={cn(
        "max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed",
        role === 'user'
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10"
          : "bg-muted/50 border border-subtle"
      )}>
        {role === 'assistant' ? (
          <>
            {content ? (
              <AnswerDocument content={content} />
            ) : bubbleStreaming ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Spinner className="size-4" />
                <span className="text-sm">Thinking...</span>
              </div>
            ) : null}

            {error && (
              <p className="text-sm text-destructive mt-2">{error}</p>
            )}

            {sources && sources.length > 0 && (
              <div className="mt-4 pt-4 border-t border-subtle space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Sources</p>
                <div className="grid gap-2">
                  {sources.map((source) => (
                    <button
                      key={source.documentId}
                      onClick={() => onSourceClick?.(source.documentId)}
                      className="flex items-center justify-between gap-3 rounded-xl border border-subtle bg-background/50 p-3 text-left transition hover:bg-accent/50 group/source"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground group-hover/source:text-primary transition-colors">
                          {source.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {source.author || 'Author unknown'}
                        </p>
                      </div>
                      <ExternalLink className="size-3 shrink-0 text-muted-foreground group-hover/source:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="whitespace-pre-wrap">{content}</p>
        )}
      </div>

      {role === 'assistant' && !bubbleStreaming && createdAt && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest px-2">
          <Bot className="size-3" />
          MindStack AI • {formatDistanceToNow(new Date(createdAt))} ago
        </div>
      )}

      {role === 'assistant' && bubbleStreaming && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest px-2">
          <Spinner className="size-3" />
          Generating response...
        </div>
      )}
    </div>
  );
}
