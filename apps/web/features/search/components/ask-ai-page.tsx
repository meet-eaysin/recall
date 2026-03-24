'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Bot, ExternalLink, History, Plus, SendHorizonal } from 'lucide-react';
import type {
  AskResult,
  ChatConversationDetail,
  ChatConversationSummary,
} from '@repo/types';
import { AnswerDocument } from './answer-document';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { QUERY_KEYS } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import { useDocuments } from '@/features/library/hooks';
import { searchApi } from '../api';
import { useSearchChat, useSearchChats } from '../hooks';
import { PageContainer } from '@/features/workspace/components/page-container';

type StreamingState = {
  answer: string;
  conversationId: string | null;
  error: string | null;
  isStreaming: boolean;
  question: string;
};

function upsertConversationSummary(
  conversations: ChatConversationSummary[] | undefined,
  result: AskResult,
  question: string,
  documentIds: string[],
): ChatConversationSummary[] {
  const nextConversation: ChatConversationSummary = {
    id: result.conversationId,
    title: question.slice(0, 80) || 'Untitled conversation',
    documentIds,
    messageCount: 2,
    lastMessagePreview: result.answer.slice(0, 140) || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isArchived: false,
  };

  const next = conversations ? [...conversations] : [];
  const index = next.findIndex(
    (conversation) => conversation.id === result.conversationId,
  );

  if (index >= 0 && next[index]) {
    next[index] = {
      ...next[index],
      documentIds,
      messageCount: next[index].messageCount + 2,
      lastMessagePreview: nextConversation.lastMessagePreview,
      updatedAt: nextConversation.updatedAt,
    };
  } else {
    next.unshift(nextConversation);
  }

  return next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function upsertConversationDetail(
  previous: ChatConversationDetail | undefined,
  result: AskResult,
  question: string,
  documentIds: string[],
): ChatConversationDetail {
  const now = new Date().toISOString();
  const existingMessages = previous?.messages ?? [];

  return {
    id: result.conversationId,
    title:
      previous?.title ?? (question.slice(0, 80) || 'Untitled conversation'),
    documentIds,
    messageCount: existingMessages.length + 2,
    lastMessagePreview: result.answer.slice(0, 140) || null,
    createdAt: previous?.createdAt ?? now,
    isArchived: false,
    updatedAt: now,
    messages: [
      ...existingMessages,
      {
        id: `user-${now}`,
        role: 'user',
        content: question,
        status: 'completed',
        sources: [],
        tokensUsed: 0,
        createdAt: now,
      },
      {
        id: `assistant-${now}`,
        role: 'assistant',
        content: result.answer,
        status: 'completed',
        sources: result.sources,
        tokensUsed: result.tokensUsed,
        createdAt: now,
      },
    ],
  };
}

function ConversationList({
  activeConversationId,
  conversations,
  isLoading,
  onNewChat,
  onSelect,
}: {
  activeConversationId: string | null;
  conversations: ChatConversationSummary[];
  isLoading: boolean;
  onNewChat: () => void;
  onSelect: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-18 rounded-lg" />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <Alert>
        <AlertTitle>No conversations yet</AlertTitle>
        <AlertDescription>
          Your previous Ask AI threads will appear here.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" className="w-full" onClick={onNewChat}>
        <Plus className="size-4" />
        New conversation
      </Button>
      {conversations.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          className={cn(
            'w-full rounded-lg border px-3 py-3 text-left transition hover:bg-accent/30',
            activeConversationId === item.id
              ? 'border-ring bg-accent/30'
              : 'border-transparent',
          )}
        >
          <p className="line-clamp-1 text-sm font-medium text-foreground">
            {item.title}
          </p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
            {item.lastMessagePreview || 'No assistant response stored yet.'}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
          </p>
        </button>
      ))}
    </div>
  );
}

function ScopeSelector({
  documents,
  selectedDocumentIds,
  setSelectedDocumentIds,
}: {
  documents: Array<{ id: string; title: string }>;
  selectedDocumentIds: string[];
  setSelectedDocumentIds: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  return (
    <Field className="gap-3">
      <div className="space-y-1">
        <FieldLabel>Limit to selected documents</FieldLabel>
        <FieldDescription>
          Optional. Leave everything unchecked to search across your full
          library.
        </FieldDescription>
      </div>
      <div className="space-y-2">
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No documents available.
          </p>
        ) : (
          documents.map((document) => {
            const checked = selectedDocumentIds.includes(document.id);

            return (
              <label
                key={document.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg py-1"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(nextChecked) =>
                    setSelectedDocumentIds((current) =>
                      nextChecked
                        ? [...current, document.id]
                        : current.filter((id) => id !== document.id),
                    )
                  }
                />
                <span className="text-sm text-foreground">
                  {document.title}
                </span>
              </label>
            );
          })
        )}
      </div>
    </Field>
  );
}

export function AskAiPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const conversationId = searchParams.get('chat');

  const [question, setQuestion] = React.useState('');
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [scopeOpen, setScopeOpen] = React.useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = React.useState<
    string[]
  >([]);
  const [streaming, setStreaming] = React.useState<StreamingState>({
    answer: '',
    conversationId,
    error: null,
    isStreaming: false,
    question: '',
  });

  const { data: conversations = [], isLoading: conversationsLoading } =
    useSearchChats();
  const { data: conversation, isLoading: conversationLoading } =
    useSearchChat(conversationId);
  const { data: documentsData } = useDocuments({ limit: 12, page: 1 });

  React.useEffect(() => {
    setStreaming((current) => ({
      ...current,
      conversationId,
    }));
  }, [conversationId]);

  React.useEffect(() => {
    if (conversation) {
      setSelectedDocumentIds(conversation.documentIds ?? []);
      return;
    }

    if (!conversationId) {
      setSelectedDocumentIds([]);
    }
  }, [conversation, conversationId]);

  const openConversation = React.useCallback(
    (id: string) => {
      setHistoryOpen(false);
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set('chat', id);
      router.replace(`${pathname}?${nextParams.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const startNewConversation = React.useCallback(() => {
    setHistoryOpen(false);
    setQuestion('');
    setStreaming({
      answer: '',
      conversationId: null,
      error: null,
      isStreaming: false,
      question: '',
    });
    setScopeOpen(false);
    setSelectedDocumentIds([]);
    router.replace(pathname);
  }, [pathname, router]);

  const submitQuestion = React.useCallback(async () => {
    const trimmed = question.trim();
    if (!trimmed || streaming.isStreaming) return;

    const activeDocumentIds =
      selectedDocumentIds.length > 0 ? selectedDocumentIds : [];

    setStreaming({
      answer: '',
      conversationId,
      error: null,
      isStreaming: true,
      question: trimmed,
    });
    setQuestion('');

    try {
      await searchApi.streamAsk(
        {
          conversationId: conversationId ?? undefined,
          documentIds:
            activeDocumentIds.length > 0 ? activeDocumentIds : undefined,
          question: trimmed,
        },
        {
          onEvent: (event) => {
            if (event.type === 'conversation') {
              setStreaming((current) => ({
                ...current,
                conversationId: event.conversationId,
              }));

              if (!conversationId) {
                const nextParams = new URLSearchParams(searchParams.toString());
                nextParams.set('chat', event.conversationId);
                router.replace(`${pathname}?${nextParams.toString()}`);
              }

              return;
            }

            if (event.type === 'delta') {
              setStreaming((current) => ({
                ...current,
                answer: `${current.answer}${event.chunk}`,
              }));
              return;
            }

            if (event.type === 'error') {
              setStreaming((current) => ({
                ...current,
                error: event.message,
                isStreaming: false,
              }));
              return;
            }

            queryClient.setQueryData(
              QUERY_KEYS.SEARCH.chat(event.data.conversationId),
              (previous: ChatConversationDetail | undefined) =>
                upsertConversationDetail(
                  previous,
                  event.data,
                  trimmed,
                  activeDocumentIds,
                ),
            );
            queryClient.setQueryData(
              QUERY_KEYS.SEARCH.chats(),
              (previous: ChatConversationSummary[] | undefined) =>
                upsertConversationSummary(
                  previous,
                  event.data,
                  trimmed,
                  activeDocumentIds,
                ),
            );
            void queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.SEARCH.chat(event.data.conversationId),
            });
            void queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.SEARCH.chats(),
            });

            setStreaming({
              answer: '',
              conversationId: event.data.conversationId,
              error: null,
              isStreaming: false,
              question: '',
            });
          },
        },
      );
    } catch (error) {
      setStreaming((current) => ({
        ...current,
        error:
          error instanceof Error ? error.message : 'Failed to stream answer',
        isStreaming: false,
      }));
    }
  }, [
    conversationId,
    pathname,
    queryClient,
    question,
    router,
    searchParams,
    selectedDocumentIds,
    streaming.isStreaming,
  ]);

  const displayedMessages = React.useMemo(() => {
    const baseMessages = conversation?.messages ?? [];

    if (
      streaming.isStreaming &&
      streaming.conversationId &&
      streaming.conversationId === (conversationId ?? streaming.conversationId)
    ) {
      return [
        ...baseMessages,
        {
          id: 'stream-user',
          role: 'user' as const,
          content: streaming.question,
          status: 'completed' as const,
          sources: [],
          tokensUsed: 0,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'stream-assistant',
          role: 'assistant' as const,
          content: streaming.answer,
          status: streaming.error ? ('error' as const) : ('completed' as const),
          sources: [],
          tokensUsed: 0,
          createdAt: new Date().toISOString(),
        },
      ];
    }

    return baseMessages;
  }, [conversation?.messages, conversationId, streaming]);

  const availableDocuments = (documentsData?.items ?? []).map((document) => ({
    id: document.id,
    title: document.title,
  }));

  return (
    <PageContainer className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Ask AI</h1>
        <p className="text-muted-foreground">
          Start a conversation grounded in your document library.
        </p>
      </header>
      <div className="space-y-4">
        <Drawer
          position="right"
          open={historyOpen}
          onOpenChange={setHistoryOpen}
        >
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle>
                    {conversation?.title ?? 'Start a new conversation'}
                  </CardTitle>
                  <CardDescription>
                    Ask a question and MindStack AI will answer with sources
                    from your library.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <DrawerTrigger>
                    <Button variant="outline">
                      <History className="size-4" />
                      Previous conversations
                    </Button>
                  </DrawerTrigger>
                  {conversationId ? (
                    <Button variant="outline" onClick={startNewConversation}>
                      <Plus className="size-4" />
                      New chat
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardPanel className="space-y-5">
              <Field>
                <FieldLabel>Your question</FieldLabel>
                <InputGroup data-align="block-end">
                  <InputGroupTextarea
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="Ask about a document, summarize a topic, or continue the current thread."
                    onKeyDown={(event) => {
                      if (
                        event.key === 'Enter' &&
                        (event.metaKey || event.ctrlKey)
                      ) {
                        event.preventDefault();
                        void submitQuestion();
                      }
                    }}
                  />
                  <InputGroupAddon
                    align="block-end"
                    className="justify-between"
                  >
                    <InputGroupText>
                      {streaming.isStreaming ? (
                        <>
                          <Spinner className="size-4" />
                          Streaming response
                        </>
                      ) : (
                        'Press Ctrl/Cmd + Enter to send'
                      )}
                    </InputGroupText>
                    <Button
                      onClick={() => void submitQuestion()}
                      disabled={streaming.isStreaming}
                    >
                      <SendHorizonal className="size-4" />
                      Ask AI
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
              </Field>

              <Collapsible open={scopeOpen} onOpenChange={setScopeOpen}>
                <div className="space-y-3 rounded-lg border px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Optional scope
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedDocumentIds.length > 0
                          ? `${selectedDocumentIds.length} document${selectedDocumentIds.length > 1 ? 's' : ''} selected`
                          : 'Search across your whole library'}
                      </p>
                    </div>
                    <CollapsibleTrigger className="text-sm font-medium text-foreground">
                      {scopeOpen ? 'Hide' : 'Adjust'}
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <Separator className="mb-3" />
                    <ScopeSelector
                      documents={availableDocuments}
                      selectedDocumentIds={selectedDocumentIds}
                      setSelectedDocumentIds={setSelectedDocumentIds}
                    />
                  </CollapsibleContent>
                </div>
              </Collapsible>

              {streaming.error ? (
                <Alert variant="error">
                  <AlertTitle>Request failed</AlertTitle>
                  <AlertDescription>{streaming.error}</AlertDescription>
                </Alert>
              ) : null}
              <Separator />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">
                  Conversation
                </h3>
                <p className="text-sm text-muted-foreground">
                  Responses stream live and are saved to history automatically.
                </p>
              </div>
              <ScrollArea className="h-[55vh]">
                <div className="space-y-4 pe-3">
                  {conversationLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="rounded-lg border p-4">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="mt-3 h-20 w-full" />
                      </div>
                    ))
                  ) : displayedMessages.length > 0 ? (
                    displayedMessages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          'rounded-lg border p-4',
                          message.role === 'assistant'
                            ? 'bg-background'
                            : 'bg-muted/35',
                        )}
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            {message.role === 'assistant' ? (
                              <Bot className="size-4 text-primary" />
                            ) : (
                              <SendHorizonal className="size-4 text-muted-foreground" />
                            )}
                            <p className="text-sm font-medium text-foreground">
                              {message.role === 'assistant'
                                ? 'MindStack AI'
                                : 'You'}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(message.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>

                        {message.role === 'assistant' ? (
                          <AnswerDocument
                            className="text-pretty"
                            content={message.content || 'Thinking...'}
                          />
                        ) : (
                          <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                            {message.content}
                          </p>
                        )}

                        {message.role === 'assistant' &&
                        message.sources.length > 0 ? (
                          <div className="mt-5 space-y-3 border-t pt-4">
                            <p className="text-xs font-medium text-muted-foreground">
                              Sources
                            </p>
                            <div className="space-y-2">
                              {message.sources.map((source) => (
                                <Link
                                  key={`${message.id}-${source.documentId}`}
                                  href={`/app/library/${source.documentId}`}
                                  className="flex items-center justify-between rounded-lg border p-3 transition hover:bg-accent/30"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-foreground">
                                      {source.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {source.author || 'Unknown author'}
                                      {source.publishedAt
                                        ? ` · ${source.publishedAt}`
                                        : ''}
                                    </p>
                                  </div>
                                  <ExternalLink className="size-4 text-muted-foreground" />
                                </Link>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <Alert>
                      <AlertTitle>No messages yet</AlertTitle>
                      <AlertDescription>
                        Ask your first question to start a grounded
                        conversation.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </ScrollArea>
            </CardPanel>
          </Card>
          <DrawerContent className="sm:max-w-md">
            <DrawerHeader>
              <DrawerTitle>Previous conversations</DrawerTitle>
              <DrawerDescription>
                Reopen a saved thread and continue asking.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4">
              <ConversationList
                activeConversationId={conversationId}
                conversations={conversations}
                isLoading={conversationsLoading}
                onNewChat={startNewConversation}
                onSelect={openConversation}
              />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </PageContainer>
  );
}
