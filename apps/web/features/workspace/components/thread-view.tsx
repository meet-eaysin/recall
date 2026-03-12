'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Bot, SendHorizonal, Trash2, Settings2, ExternalLink } from 'lucide-react';
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

export function ThreadView() {
  const params = useParams();
  const queryClient = useQueryClient();
  const threadId = typeof params.threadId === 'string' ? params.threadId : null;

  const [question, setQuestion] = React.useState('');
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [streamingAnswer, setStreamingAnswer] = React.useState('');
  const [previewId, setPreviewId] = React.useState<string | null>(null);

  const { data: conversation, isLoading } = useSearchChat(threadId);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages, streamingAnswer, isStreaming]);

  const submitQuestion = async () => {
    const trimmed = question.trim();
    if (!trimmed || isStreaming) return;

    setIsStreaming(true);
    setStreamingAnswer('');
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
              setIsStreaming(false);
            } else if (event.type === 'done') {
              // Final success - invalidate queries to refresh history and detail
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SEARCH.chat(threadId ?? '') });
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SEARCH.chats() });
              setIsStreaming(false);
              setStreamingAnswer('');
            }
          },
        }
      );
    } catch (error) {
      console.error(error);
      setIsStreaming(false);
    }
  };

  if (isLoading || typeof threadId !== 'string') {
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

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{conversation?.title || 'Untitled Thread'}</h1>
            <p className="text-sm text-muted-foreground">
              Started {conversation ? formatDistanceToNow(new Date(conversation.createdAt)) : ''} ago
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <Settings2 className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-xl text-destructive hover:bg-destructive/10">
              <Trash2 className="size-4" />
            </Button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-hidden relative">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-12 pb-24">
              {conversation?.messages.map((message) => (
                <div key={message.id} className={cn(
                  "group relative flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500",
                  message.role === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed",
                    message.role === 'user' 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10" 
                      : "bg-muted/50 border border-subtle backdrop-blur-sm"
                  )}>
                    {message.role === 'assistant' ? (
                      <>
                        <AnswerDocument content={message.content} />
                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-subtle space-y-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Sources</p>
                            <div className="grid gap-2">
                              {message.sources.map((source) => (
                                <button
                                  key={source.documentId}
                                  onClick={() => setPreviewId(source.documentId)}
                                  className="flex items-center justify-between gap-3 rounded-xl border border-subtle bg-background/50 p-3 text-left transition hover:bg-accent/50 group/source"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-foreground group-hover/source:text-primary transition-colors">
                                      {source.title}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                      {source.author || 'Author unknown'}
                                    </p>
                                  </div>
                                  <ExternalLink className="size-3 text-muted-foreground group-hover/source:text-primary transition-colors" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest px-2">
                      <Bot className="size-3" />
                      MindStack AI • {formatDistanceToNow(new Date(message.createdAt))} ago
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming Message */}
              {isStreaming && (
                <div className="flex flex-col items-start gap-4">
                  <div className="max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed bg-muted/50 border border-subtle backdrop-blur-sm">
                    <AnswerDocument content={streamingAnswer || 'Thinking...'} />
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest px-2">
                    <Spinner className="size-3" />
                    Generating response...
                  </div>
                </div>
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
                      submitQuestion();
                    }
                  }}
                  className="min-h-[60px] max-h-[200px] resize-none bg-transparent"
                />
                <InputGroupAddon align="block-end" className="p-1">
                  <Button 
                    size="icon" 
                    onClick={submitQuestion} 
                    disabled={isStreaming || !question.trim()}
                    className="rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105"
                  >
                    <SendHorizonal className="size-4" />
                  </Button>
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>
          <p className="mt-3 text-center text-[10px] text-muted-foreground uppercase tracking-widest">
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
