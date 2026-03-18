'use client';

import * as React from 'react';
import { Brain, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDocumentDetail } from '../context';

export function TranscriptTab() {
  const { id, document, transcript, actions } = useDocumentDetail();

  if (!document) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold tracking-tight">Video Transcript</h3>
          <p className="text-sm text-muted-foreground">
            Full extraction of audio content for deep search and analysis.
          </p>
        </div>
        <Button
          onClick={() => actions.generateTranscript.mutate(id)}
          disabled={actions.generateTranscript.isPending}
          variant="outline"
          className="h-9 px-4 rounded-full font-medium gap-2 shadow-sm"
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
          <ScrollArea className="h-[60vh] max-h-[700px]">
            <div className="p-10">
              <p className="text-[15px] leading-relaxed text-foreground/80 whitespace-pre-wrap font-sans-subtle selection:bg-primary/20">
                {transcript.content}
              </p>
            </div>
          </ScrollArea>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 py-24 text-center rounded-3xl border border-dashed bg-muted/20">
          <div className="rounded-3xl bg-muted/40 p-8 ring-1 ring-border shadow-inner">
            <Brain className="size-10 text-muted-foreground/20" />
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-lg">No transcript available</h4>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Unlock full-text search and AI insights for this video by generating a transcript.
            </p>
          </div>
          <Button
            onClick={() => actions.generateTranscript.mutate(id)}
            className="h-10 px-6 rounded-full font-semibold"
          >
            Generate Now
          </Button>
        </div>
      )}
    </div>
  );
}
