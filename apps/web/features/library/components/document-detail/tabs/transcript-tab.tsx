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

      {transcript?.status === 'completed' && transcript.content ? (
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden group hover:border-primary/20 transition-all">
          <ScrollArea
            className={cn('h-[60vh] max-h-[700px]', isCompact && 'h-[50vh]')}
          >
            <div className={cn('p-5', isCompact && 'p-3')}>
              <p className="text-[15px] leading-relaxed text-foreground/80 whitespace-pre-wrap font-sans-subtle selection:bg-primary/20">
                {transcript.content}
              </p>
            </div>
          </ScrollArea>
        </div>
      ) : transcript?.status === 'pending' ||
        actions.generateTranscript.isPending ? (
        <Empty className={cn('py-24', isCompact && 'py-12')}>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LoaderCircle className="size-5 text-primary animate-spin" />
            </EmptyMedia>
            <EmptyTitle>Extracting Transcript...</EmptyTitle>
            <EmptyDescription>
              We&apos;re currently fetching and processing the video transcript.
              This usually takes a few seconds.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : transcript?.status === 'unavailable' ? (
        <Empty className={cn('py-24', isCompact && 'py-12')}>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Brain className="size-5 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>Transcript Not Available</EmptyTitle>
            <EmptyDescription>
              {transcript.reason ||
                'The transcript for this video is disabled or not provided by YouTube.'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : transcript?.status === 'failed' ? (
        <Empty className={cn('py-24', isCompact && 'py-12')}>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Brain className="size-5 text-destructive" />
            </EmptyMedia>
            <EmptyTitle>Extraction Failed</EmptyTitle>
            <EmptyDescription>
              {transcript.reason ||
                'An unexpected error occurred during extraction.'}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              onClick={() => actions.generateTranscript.mutate(id)}
              disabled={actions.generateTranscript.isPending}
              variant="outline"
            >
              {actions.generateTranscript.isPending ? (
                <LoaderCircle className="size-3.5 animate-spin mr-2" />
              ) : null}
              Retry Extraction
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <Empty className={cn('py-24', isCompact && 'py-12')}>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Brain className="size-5 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>No Transcript Yet</EmptyTitle>
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
              {actions.generateTranscript.isPending ? (
                <LoaderCircle className="size-3.5 animate-spin mr-2" />
              ) : null}
              Generate Now
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </div>
  );
}
