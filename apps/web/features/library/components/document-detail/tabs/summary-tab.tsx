'use client';

import * as React from 'react';
import { LoaderCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useDocumentDetail } from '../context';

export function SummaryTab() {
  const { id, document, actions } = useDocumentDetail();
  const [removeSummaryOpen, setRemoveSummaryOpen] = React.useState(false);

  if (!document) return null;

  async function handleRemoveSummary() {
    await actions.deleteSummary.mutateAsync(id);
    setRemoveSummaryOpen(false);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-4">
      <div className="lg:col-span-3 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="size-5 text-primary animate-pulse" />
              AI-Generated Insights
            </h3>
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
            <div className="relative rounded-2xl border bg-card p-8 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Sparkles className="size-12 text-primary" />
              </div>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-[17px] leading-relaxed text-foreground/80 font-serif-subtle whitespace-pre-wrap">
                  {document.summary}
                </p>
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
                  Our AI will analyze the entire document to provide you with key takeaways and core arguments.
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

      <aside className="space-y-6">
        <div className="rounded-2xl border bg-muted/20 p-6 space-y-6">
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Highlights
            </h4>
            <div className="h-0.5 w-8 bg-primary/30 rounded-full" />
          </div>
          <ul className="space-y-5">
            {[
              "Automated key theme extraction",
              "Saves ~15 mins of reading time",
              "Context-aware synthesis",
              "Instant retrieval ready"
            ].map((feature, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="mt-1.5 size-1.5 rounded-full bg-primary/40 shrink-0" />
                <span className="text-xs font-medium leading-snug text-foreground/70">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

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
