'use client';

import * as React from 'react';
import { OmniBox } from './omni-box';
import { HomeContent } from '@/features/home/components/home-page';
import { useThreadStream } from './thread-stream-context';
import { useSearchChat } from '@/features/search/hooks';
import { useDocuments } from '@/features/library/hooks';
import { DocumentDetailView } from '@/features/library/components/document-detail-view';
import { ResizableDocumentPreview } from './resizable-document-preview';
import { Chat } from '@/components/ai/chat';
import type { Message } from '@/components/ai/chat-message';
import { PageContainer } from './page-container';
import { useChatFollowUpStream } from '../hooks/use-chat-follow-up-stream';
import { mapConversationMessages } from '../lib/chat-message-mappers';

export function WorkspacePage() {
  const threadStream = useThreadStream();
  const activeStream = threadStream.activeStream;
  const { data: documentsData, isLoading: docsLoading } = useDocuments({
    limit: 1,
    page: 1,
  });

  const isEmptyLibrary = !docsLoading && documentsData?.total === 0;

  if (activeStream) return <InlineChat />;

  return (
    <PageContainer>
      <OmniBox disabled={isEmptyLibrary} />

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

function InlineChatSkeleton() {
  return (
    <PageContainer
      isFullHeight
      className="absolute inset-0 px-0 py-0 overflow-hidden"
    >
      <div className="flex flex-col h-full bg-background animate-pulse">
        {/* Skeleton Messages */}
        <div className="flex-1 space-y-8 p-4 md:p-8 overflow-hidden">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col gap-4">
              <div className="h-4 w-3/4 rounded bg-muted/60" />
              <div className="h-4 w-1/2 rounded bg-muted/40" />
            </div>
            <div className="flex flex-col items-end gap-4">
              <div className="h-4 w-2/3 rounded bg-muted/60" />
            </div>
            <div className="flex flex-col gap-4">
              <div className="h-20 w-full rounded bg-muted/40" />
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function InlineChat() {
  const threadStream = useThreadStream();
  const activeStream = threadStream.activeStream;
  const conversationId = activeStream?.conversationId ?? null;
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
  } = useChatFollowUpStream(conversationId);

  const { data: conversation } = useSearchChat(conversationId);

  const stopGeneration = () => {
    stop();
    threadStream.abortStream();
  };

  // Build the message list
  const persistedMessages = mapConversationMessages(conversation);

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
    if (usePersistedOnly) {
      list.push(...persistedMessages);
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
    persistedMessages,
    usePersistedOnly,
    activeStream,
    showInitialStream,
    streamingQuestion,
    streamingAnswer,
    isStreaming,
    error,
  ]);

  if (!conversation && !activeStream) {
    return <InlineChatSkeleton />;
  }

  return (
    <PageContainer
      isFullHeight
      className="absolute inset-0 px-0 py-0! pb-0 md:pb-0 lg:pb-0 overflow-hidden"
    >
      {/* Main Chat Area */}
      <div className="flex flex-col h-full min-h-0 overflow-hidden w-full">
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

      {/* Document Preview Overlay */}
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
