'use client';

import * as React from 'react';
import { Brain, Sparkles, StickyNote, Zap } from 'lucide-react';
import { DocumentType } from '@repo/types';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { useDocumentDetail } from '../context';
import { SummaryTab } from './summary-tab';
import { NotesTab } from './notes-tab';
import { TranscriptTab } from './transcript-tab';
import { DetailsTab } from './details-tab';

export function DocumentDetailTabs({
  isCompact = false,
}: {
  isCompact?: boolean;
}) {
  const { document, notes } = useDocumentDetail();

  if (!document) return null;

  const isYoutubeDocument = document.type === DocumentType.YOUTUBE;

  return (
    <Tabs defaultValue="summary">
      <TabsList>
        <TabsTrigger value="summary">
          <Sparkles />
          Summary
        </TabsTrigger>
        <TabsTrigger value="notes">
          <StickyNote />
          Research Notes
          {notes.length > 0 && (
            <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary ring-1 ring-inset ring-primary/20">
              {notes.length}
            </span>
          )}
        </TabsTrigger>
        {isYoutubeDocument && (
          <TabsTrigger value="transcript">
            <Brain />
            Transcript
          </TabsTrigger>
        )}

        <TabsTrigger value="details">
          <Zap />
          Details
        </TabsTrigger>
      </TabsList>

      <div className="focus-visible:outline-none mt-3">
        <TabsContent value="summary" className="focus-visible:outline-none">
          <SummaryTab isCompact={isCompact} />
        </TabsContent>

        <TabsContent value="notes" className="focus-visible:outline-none">
          <NotesTab isCompact={isCompact} />
        </TabsContent>

        {isYoutubeDocument && (
          <TabsContent
            value="transcript"
            className="focus-visible:outline-none"
          >
            <TranscriptTab isCompact={isCompact} />
          </TabsContent>
        )}

        <TabsContent value="details" className="focus-visible:outline-none">
          <DetailsTab isCompact={isCompact} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
