'use client';

import * as React from 'react';
import { Brain, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDocumentDetail } from '../context';

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { cn } from '@/lib/utils';

export function TranscriptTab({ isCompact = false }: { isCompact?: boolean }) {
  const { id, document, transcript, actions } = useDocumentDetail();

  if (!document) return null;

  return (
    <div
      className={cn(
        'mx-auto space-y-12 pb-20',
        isCompact && 'max-w-none space-y-6 pb-10',
      )}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3
            className={cn(
              'text-2xl font-bold tracking-tight',
              isCompact && 'text-xl',
            )}
          >
            Video Transcript
          </h3>
          {!isCompact && (
            <p className="text-sm text-muted-foreground">
              Full extraction of audio content for deep search and analysis.
            </p>
          )}
        </div>
        <Button
          onClick={() => actions.generateTranscript.mutate(id)}
          disabled={actions.generateTranscript.isPending}
          variant="outline"
        >
          {actions.generateTranscript.isPending ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <Brain className="size-3.5" />
          )}
          {transcript?.content ? 'Regenerate' : 'Generate Transcript'}
        </Button>
      </div>

      {transcript?.content ? (
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden group hover:border-primary/20 transition-all">
          <div className="bg-muted/30 px-6 py-2 border-b flex items-center justify-between dark:bg-zinc-900/50">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Transcript View
            </span>
            <div className="flex gap-1">
              <div className="size-1.5 rounded-full bg-border" />
              <div className="size-1.5 rounded-full bg-border" />
              <div className="size-1.5 rounded-full bg-border" />
            </div>
          </div>
          <ScrollArea
            className={cn('h-[60vh] max-h-[700px]', isCompact && 'h-[50vh]')}
          >
            <div className={cn('p-10', isCompact && 'p-6')}>
              <p className="text-[15px] leading-relaxed text-foreground/80 whitespace-pre-wrap font-sans-subtle selection:bg-primary/20">
                {transcript.content}
              </p>
            </div>
          </ScrollArea>
        </div>
      ) : (
        <Empty className={cn('py-24', isCompact && 'py-12')}>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Brain className="size-5 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>No transcript available</EmptyTitle>
            <EmptyDescription>
              Unlock full-text search and AI insights for this video by
              generating a transcript.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              onClick={() => actions.generateTranscript.mutate(id)}
              disabled={actions.generateTranscript.isPending}
            >
              Generate Now
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </div>
  );
}
