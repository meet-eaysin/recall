'use client';

import * as React from 'react';
import { Info, LoaderCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverTitle,
} from '@/components/ui/popover';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useDocumentDetail } from '../context';

import { cn } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/ai/markdown-renderer';

const HIGHLIGHTS = [
  'Automated key theme extraction',
  'Saves ~15 mins of reading time',
  'Context-aware synthesis',
  'Instant retrieval ready',
];

export function SummaryTab({ isCompact = false }: { isCompact?: boolean }) {
  const { id, document, actions } = useDocumentDetail();
  const [removeSummaryOpen, setRemoveSummaryOpen] = React.useState(false);

  if (!document) return null;

  async function handleRemoveSummary() {
    await actions.deleteSummary.mutateAsync(id);
    setRemoveSummaryOpen(false);
  }

  return (
    <div
      className={cn(
        'max-w-5xl mx-auto space-y-6 pb-20',
        isCompact && 'max-w-none pb-10',
      )}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="size-5 text-primary animate-pulse" />
                AI-Generated Insights
              </h3>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full text-muted-foreground/40 hover:text-primary hover:bg-primary/5 transition-colors"
                    />
                  }
                >
                  <Info className="size-3.5" />
                </PopoverTrigger>
                <PopoverContent
                  side="right"
                  align="start"
                  className="w-64 p-4 shadow-xl border-primary/10"
                >
                  <PopoverTitle className="text-xs font-bold tracking-widest text-primary mb-3">
                    Highlights
                  </PopoverTitle>
                  <ul className="space-y-2.5">
                    {HIGHLIGHTS.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-xs"
                      >
                        <div className="mt-1.5 size-1 rounded-full bg-primary/40 shrink-0" />
                        <span className="text-foreground/70 leading-relaxed">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </PopoverContent>
              </Popover>
            </div>
            <p className="text-sm text-muted-foreground">
              A comprehensive distillation of the document&apos;s core concepts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {document.summary && (
              <Button
                onClick={() => setRemoveSummaryOpen(true)}
                size="sm"
                variant="ghost"
                className="h-8 text-xs font-medium text-muted-foreground hover:text-destructive"
              >
                Clear
              </Button>
            )}
            <Button
              onClick={() => actions.generateSummary.mutate(id)}
              size="sm"
              disabled={actions.generateSummary.isPending}
              className="h-8 gap-2 bg-primary/95 hover:bg-primary shadow-sm"
            >
              {actions.generateSummary.isPending ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              {document.summary ? 'Regenerate' : 'Generate Summary'}
            </Button>
          </div>
        </div>

        <div className="relative group">
          {document.summary ? (
            <div className="relative rounded-2xl border bg-card p-8 shadow-sm transition-all hover:shadow-md hover:border-primary/10">
              <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity">
                <Sparkles className="size-6 text-primary" />
              </div>
              <div className="max-w-none text-foreground/90 font-serif-subtle">
                <MarkdownRenderer>{document.summary}</MarkdownRenderer>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 rounded-2xl border border-dashed bg-muted/30 py-20 text-center transition-colors hover:bg-muted/50">
              <div className="rounded-2xl bg-primary/5 p-5 ring-1 ring-primary/10">
                <Sparkles className="size-10 text-primary/40" />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-foreground/90">
                  Ready to distill this content?
                </h4>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  Our AI will analyze the entire document to provide you with
                  key takeaways and core arguments.
                </p>
              </div>
              <Button
                onClick={() => actions.generateSummary.mutate(id)}
                variant="outline"
                className="h-10 px-6 rounded-full font-medium"
              >
                Begin Analysis
              </Button>
            </div>
          )}
        </div>
      </div>

      <ConfirmationDialog
        open={removeSummaryOpen}
        openChangeAction={setRemoveSummaryOpen}
        confirmAction={handleRemoveSummary}
        isPending={actions.deleteSummary.isPending}
        title="Remove summary?"
        description="This removes the generated summary from the document. You can generate it again later."
        confirmLabel="Remove summary"
        tone="destructive"
      />
    </div>
  );
}
