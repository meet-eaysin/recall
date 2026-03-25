'use client';

import {
  forwardRef,
  useCallback,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { ArrowDown, ThumbsDown, ThumbsUp } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAutoScroll } from '@/hooks/use-auto-scroll';
import { Button } from '@/components/ui/button';
import { type Message } from '@/components/ai/chat-message';
import { CopyButton } from '@/components/ai/copy-button';
import { MessageInput } from '@/components/ai/message-input';
import { MessageList } from '@/components/ai/message-list';
import { PromptSuggestions } from '@/components/ai/prompt-suggestions';

interface ChatPropsBase {
  handleSubmit: (
    event?: { preventDefault?: () => void },
    options?: { experimental_attachments?: FileList },
  ) => void;
  messages: Array<Message>;
  input: string;
  className?: string;
  handleInputChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  isGenerating: boolean;
  stop?: () => void;
  onRateResponse?: (
    messageId: string,
    rating: 'thumbs-up' | 'thumbs-down',
  ) => void;
  setMessages?: (messages: Message[]) => void;
  transcribeAudio?: (blob: Blob | null) => Promise<string>;
  onSourceClick?: (id: string) => void;
}

interface ChatPropsWithoutSuggestions extends ChatPropsBase {
  append?: never;
  suggestions?: never;
}

interface ChatPropsWithSuggestions extends ChatPropsBase {
  append: (message: { role: 'user'; content: string }) => void;
  suggestions: string[];
}

type ChatProps = ChatPropsWithoutSuggestions | ChatPropsWithSuggestions;

export function Chat({
  messages,
  handleSubmit,
  input,
  handleInputChange,
  stop,
  isGenerating,
  append,
  suggestions,
  className,
  onRateResponse,
  setMessages,
  transcribeAudio,
  onSourceClick,
}: ChatProps) {
  const lastMessage = messages.at(-1);
  const isEmpty = messages.length === 0;
  const isTyping = lastMessage?.role === 'user' && isGenerating;

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // Enhanced stop function that marks pending tool calls as cancelled
  const handleStop = useCallback(() => {
    stop?.();

    if (!setMessages) return;

    const latestMessages = [...messagesRef.current];
    const lastAssistantMessage = [...latestMessages]
      .reverse()
      .find((m: Message) => m.role === 'assistant');

    if (!lastAssistantMessage) return;

    let needsUpdate = false;
    let updatedMessage = { ...lastAssistantMessage };

    if (lastAssistantMessage.toolInvocations) {
      const updatedToolInvocations = lastAssistantMessage.toolInvocations.map(
        (toolInvocation: NonNullable<Message['toolInvocations']>[number]) => {
          if (toolInvocation.state === 'call') {
            needsUpdate = true;
            return {
              ...toolInvocation,
              state: 'result',
              result: {
                content: 'Tool execution was cancelled',
                __cancelled: true, // Special marker to indicate cancellation
              },
            } as const;
          }
          return toolInvocation;
        },
      );

      if (needsUpdate) {
        updatedMessage = {
          ...updatedMessage,
          toolInvocations: updatedToolInvocations,
        };
      }
    }

    if (lastAssistantMessage.parts && lastAssistantMessage.parts.length > 0) {
      const updatedParts = lastAssistantMessage.parts.map(
        (part: NonNullable<Message['parts']>[number]) => {
          if (
            part.type === 'tool-invocation' &&
            part.toolInvocation &&
            part.toolInvocation.state === 'call'
          ) {
            needsUpdate = true;
            return {
              ...part,
              toolInvocation: {
                ...part.toolInvocation,
                state: 'result' as const,
                result: {
                  content: 'Tool execution was cancelled',
                  __cancelled: true,
                },
              },
            };
          }
          return part;
        },
      );

      if (needsUpdate) {
        updatedMessage = {
          ...updatedMessage,
          parts: updatedParts,
        };
      }
    }

    if (needsUpdate) {
      const messageIndex = latestMessages.findIndex(
        (m) => m.id === lastAssistantMessage.id,
      );
      if (messageIndex !== -1) {
        latestMessages[messageIndex] = updatedMessage;
        setMessages(latestMessages);
      }
    }
  }, [stop, setMessages, messagesRef]);

  const messageOptions = useCallback(
    (message: Message) => ({
      onSourceClick,
      actions: onRateResponse ? (
        <>
          <div className="border-r pr-1">
            <CopyButton
              content={message.content}
              copyMessage="Copied response to clipboard!"
            />
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => onRateResponse(message.id, 'thumbs-up')}
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => onRateResponse(message.id, 'thumbs-down')}
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <CopyButton
          content={message.content}
          copyMessage="Copied response to clipboard!"
        />
      ),
    }),
    [onRateResponse, onSourceClick],
  );

  return (
    <ChatContainer className={cn('flex flex-col flex-1 min-h-0 overflow-hidden', className)}>
      {isEmpty && append && suggestions ? (
        <PromptSuggestions
          label="Try these prompts ✨"
          append={append}
          suggestions={suggestions}
        />
      ) : null}

      {isEmpty && !append && !suggestions ? (
        <div className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground px-6 py-20">
          No messages yet. Ask a question to start this conversation.
        </div>
      ) : null}

      {messages.length > 0 ? (
        <ChatMessages messages={messages}>
          <MessageList
            messages={messages}
            isTyping={isTyping}
            messageOptions={messageOptions}
          />
        </ChatMessages>
      ) : null}

      <ChatForm
        className="shrink-0 z-10 mx-auto w-full max-w-4xl px-4 md:px-8 pb-20 pt-3"
        isPending={isGenerating || isTyping}
        handleSubmit={handleSubmit}
      >
        {({ files, setFiles }) => (
          <MessageInput
            value={input}
            onChange={handleInputChange}
            allowAttachments
            files={files}
            setFiles={setFiles}
            stop={handleStop}
            isGenerating={isGenerating}
            transcribeAudio={transcribeAudio}
          />
        )}
      </ChatForm>
    </ChatContainer>
  );
}
Chat.displayName = 'Chat';

export function ChatMessages({
  messages,
  children,
}: React.PropsWithChildren<{
  messages: Message[];
}>) {
  const {
    containerRef,
    scrollToBottom,
    shouldAutoScroll,
  } = useAutoScroll([messages]);

  return (
    <div
      className="relative flex-1 min-h-0 overflow-y-auto"
      ref={containerRef}
    >
      <div className="max-w-4xl mx-auto w-full px-4 md:px-8 pb-4 pt-2">
        {children}
      </div>

      {!shouldAutoScroll && (
        <div className="sticky bottom-4 flex justify-center z-20 pointer-events-none">
          <Button
            onClick={scrollToBottom}
            className="h-8 w-8 rounded-full shadow-lg bg-background/80 backdrop-blur border pointer-events-auto"
            size="icon"
            variant="ghost"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export const ChatContainer = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex flex-col flex-1 w-full', className)}
      {...props}
    />
  );
});
ChatContainer.displayName = 'ChatContainer';

interface ChatFormProps {
  className?: string;
  isPending: boolean;
  handleSubmit: (
    event?: { preventDefault?: () => void },
    options?: { experimental_attachments?: FileList },
  ) => void;
  children: (props: {
    files: File[] | null;
    setFiles: React.Dispatch<React.SetStateAction<File[] | null>>;
  }) => ReactElement;
}

export const ChatForm = forwardRef<HTMLFormElement, ChatFormProps>(
  ({ children, handleSubmit, className }, ref) => {
    const [files, setFiles] = useState<File[] | null>(null);

    const onSubmit = (event: React.FormEvent) => {
      if (!files) {
        handleSubmit(event);
        return;
      }

      const fileList = createFileList(files);
      handleSubmit(event, { experimental_attachments: fileList });
      setFiles(null);
    };

    return (
      <form ref={ref} onSubmit={onSubmit} className={className}>
        {children({ files, setFiles })}
      </form>
    );
  },
);
ChatForm.displayName = 'ChatForm';

function createFileList(files: File[] | FileList): FileList {
  const dataTransfer = new DataTransfer();
  for (const file of Array.from(files)) {
    dataTransfer.items.add(file);
  }
  return dataTransfer.files;
}
