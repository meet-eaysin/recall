'use client';

import * as React from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { Search, Sparkles, Command, ArrowRight } from 'lucide-react';
import { InputGroup, InputGroupAddon, InputGroupText, InputGroupInput } from '@/components/ui/input-group';
import { Button } from '@/components/ui/button';
import { searchApi } from '@/features/search/api';
import { QUERY_KEYS } from '@/lib/query-keys';
import { useThreadStream } from './thread-stream-context';

export function OmniBox() {
  const queryClient = useQueryClient();
  const threadStream = useThreadStream();
  const [query, setQuery] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    const trimmed = query.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    setQuery('');

    try {
      await searchApi.streamAsk(
        { question: trimmed },
        {
          onEvent: (event) => {
            if (event.type === 'conversation') {
              // Set context — WorkspacePage will detect this and render chat inline
              threadStream.setStream({
                answer: '',
                conversationId: event.conversationId,
                error: null,
                isStreaming: true,
                question: trimmed,
              });
              // Silently update URL for bookmarkability — no navigation
              window.history.replaceState(null, '', `/app/t/${event.conversationId}`);
              return;
            }

            if (event.type === 'delta') {
              threadStream.updateAnswer(event.chunk);
              return;
            }

            if (event.type === 'error') {
              threadStream.failStream(event.message);
              const activeId = threadStream.activeStream?.conversationId;
              if (activeId) {
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SEARCH.chat(activeId) });
              }
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SEARCH.chats() });
              setIsSubmitting(false);
              return;
            }

            if (event.type === 'done') {
              threadStream.completeStream();
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SEARCH.chat(event.data.conversationId) });
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SEARCH.chats() });
              setIsSubmitting(false);
            }
          },
        }
      );
    } catch (error) {
      console.error('Failed to start thread:', error);
      threadStream.failStream(
        error instanceof Error ? error.message : 'Failed to connect to AI',
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-heading font-bold tracking-tight bg-linear-to-br from-foreground to-foreground/60 bg-clip-text text-transparent sm:text-5xl">
          What&apos;s on your mind?
        </h1>
        <p className="text-muted-foreground text-lg">
          Search your library or ask AI to synthesize knowledge.
        </p>
      </div>

      <div className="relative group">
        <div className="absolute -inset-0.5 bg-linear-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-focus-within:opacity-100" />

        <div className="relative bg-background border border-subtle rounded-2xl shadow-2xl p-2 transition-all duration-300 group-focus-within:border-primary/50 group-focus-within:ring-4 group-focus-within:ring-primary/5">
          <InputGroup data-align="center" className="border-0 shadow-none">
            <InputGroupAddon>
              <InputGroupText>
                <Search className="size-5 text-muted-foreground" />
              </InputGroupText>
            </InputGroupAddon>

            <InputGroupInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleSubmit();
                }
              }}
              placeholder="Filter by topic, ask a question, or jump to a thread..."
              className="text-lg bg-transparent border-0 focus-visible:ring-0 placeholder:text-muted-foreground/50 h-14"
            />

            <InputGroupAddon align="inline-end">
              <div className="flex items-center gap-2 px-2">
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 border border-subtle text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <Command className="size-3" /> K
                </div>
                <Button
                  size="sm"
                  onClick={() => void handleSubmit()}
                  disabled={isSubmitting || !query.trim()}
                  className="rounded-xl shadow-lg shadow-primary/20"
                >
                  {isSubmitting ? (
                    <ArrowRight className="size-4 mr-2 animate-pulse" />
                  ) : (
                    <Sparkles className="size-4 mr-2" />
                  )}
                  Ask AI
                </Button>
              </div>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>

      {/* Quick Actions / Suggestions */}
      <div className="flex flex-wrap items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-300">
        <span className="text-sm text-muted-foreground font-medium">Try:</span>
        {['Summarize my recent docs', 'Find Notion sync issues', 'Research the MindStack graph'].map((hint) => (
          <button
            key={hint}
            onClick={() => setQuery(hint)}
            className="px-3 py-1.5 rounded-full border border-subtle bg-muted/30 hover:bg-muted hover:border-muted-foreground/30 text-sm text-muted-foreground transition-all duration-200"
          >
            {hint}
          </button>
        ))}
      </div>
    </div>
  );
}
