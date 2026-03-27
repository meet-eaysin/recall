'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSearchChat } from '@/features/search/hooks';
import { DocumentDetailView } from '@/features/library/components/document-detail-view';
import { ResizableDocumentPreview } from './resizable-document-preview';
import { useThreadStream } from './thread-stream-context';
import { Chat } from '@/components/ai/chat';
import type { Message } from '@/components/ai/chat-message';
import { PageContainer } from './page-container';
import { ChevronLeft, MessageSquare, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from '@/components/ui/empty';
import { useChatFollowUpStream } from '../hooks/use-chat-follow-up-stream';
import { mapConversationMessages } from '../lib/chat-message-mappers';

export function ThreadView() {
  const params = useParams();
  const router = useRouter();
  const threadStream = useThreadStream();
  const threadId = typeof params.threadId === 'string' ? params.threadId : null;
  const [previewId, setPreviewId] = React.useState<string | null>(null);
  const {
    error,
    handleInputChange,
    handleSubmit,
    isStreaming,
    question,
    stop,
    streamingAnswer,
    streamingQuestion,
  } = useChatFollowUpStream(threadId);

  const { data: conversation, isLoading } = useSearchChat(threadId);

  const omniStream = threadStream.activeStream;
  const hasOmniStream =
    omniStream !== null &&
    omniStream.conversationId === threadId &&
    (omniStream.isStreaming ||
      omniStream.answer.length > 0 ||
      !!omniStream.error);

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

  const showOmniStream =
    hasOmniStream && omniStream && (conversation?.messages.length ?? 0) === 0;
  const showFollowUpStream = isStreaming;
  const persistedMessages = React.useMemo(
    () => mapConversationMessages(conversation),
    [conversation],
  );

  const messages: Message[] = React.useMemo(() => {
    const list: Message[] = [];

    list.push(...persistedMessages);

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
    persistedMessages,
    omniStream,
    showOmniStream,
    showFollowUpStream,
    streamingQuestion,
    streamingAnswer,
    error,
  ]);

  const stopGeneration = () => {
    stop();
    threadStream.abortStream();
  };

  if (isLoading && !hasOmniStream) {
    return (
      <PageContainer
        isFullHeight
        className="absolute inset-0 px-0 py-0 overflow-hidden"
      >
        <div className="flex flex-col h-full bg-background animate-pulse">
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

  if (!isLoading && !conversation && !hasOmniStream) {
    return (
      <PageContainer
        isFullHeight
        className="absolute inset-0 px-0 py-0 flex items-center justify-center bg-background"
      >
        <Empty className="max-w-md border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertCircle className="size-4" />
            </EmptyMedia>
            <EmptyTitle>Conversation not found</EmptyTitle>
            <EmptyDescription>
              This conversation may have been deleted or moved.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              onClick={() => router.push('/app')}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="mr-2 size-4" />
              Back to Dashboard
            </Button>
          </EmptyContent>
        </Empty>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      isFullHeight
      className="absolute inset-0 px-0 py-0! pb-0 md:px-0 lg:px-0 md:pb-0 lg:pb-0 overflow-hidden"
    >
      <div className="flex flex-col h-full min-h-0 overflow-hidden w-full">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center bg-background/80 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 md:px-8">
            <Button
              variant="ghost"
              size="icon"
              className="-ml-2 size-8 rounded-lg hover:bg-muted/60 shrink-0"
              onClick={() => router.push('/app')}
            >
              <ChevronLeft className="size-4" />
              <span className="sr-only">Back</span>
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <MessageSquare className="size-4 text-muted-foreground/70 shrink-0" />
              <h1 className="font-medium text-sm truncate text-muted-foreground">
                {conversation?.title || 'Chat'}
              </h1>
            </div>
          </div>
        </header>

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
