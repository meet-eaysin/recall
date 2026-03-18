'use client';

import * as React from 'react';
import { LoaderCircle, RefreshCcw, X, Zap } from 'lucide-react';
import { IngestionStatus } from '@repo/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDocumentDetail } from '../context';
import { MetaRow } from '../meta-row';

import { cn } from '@/lib/utils';

export function DetailsTab({ isCompact = false }: { isCompact?: boolean }) {
  const { id, document, ingestion, actions } = useDocumentDetail();

  if (!document) return null;

  const canRetryIngestion =
    ingestion?.ingestionStatus === IngestionStatus.FAILED &&
    !ingestion.embeddingsReady;

  return (
    <div
      className={cn(
        'grid gap-10 lg:grid-cols-2 pb-20',
        isCompact && 'grid-cols-1 gap-8 pb-10',
      )}
    >
      <div className="space-y-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Zap className="size-5 text-amber-500" />
                Ingestion Pipeline
              </h3>
              <p className="text-sm text-muted-foreground">
                Technical status of the document processing pipeline.
              </p>
            </div>
            <Button
              onClick={() => actions.retryIngestion.mutate(id)}
              size="sm"
              variant="outline"
              disabled={!canRetryIngestion || actions.retryIngestion.isPending}
              className="h-8 rounded-full gap-2 text-xs font-semibold"
            >
              {actions.retryIngestion.isPending ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <RefreshCcw className="size-3.5" />
              )}
              Retry Pipeline
            </Button>
          </div>

          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden divide-y divide-border/50">
            <div className="flex items-center justify-between p-5 bg-muted/5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                Pipeline Status
              </span>
              <Badge
                className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  ingestion?.ingestionStatus === IngestionStatus.COMPLETED
                    ? 'bg-green-500/10 text-green-600 border-green-500/20 shadow-none'
                    : ingestion?.ingestionStatus === IngestionStatus.FAILED
                      ? 'bg-red-500/10 text-red-600 border-red-500/20 shadow-none'
                      : 'bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-none'
                }`}
              >
                {ingestion?.ingestionStatus ?? 'Unknown'}
              </Badge>
            </div>
            <MetaRow
              label="Vector Indexing"
              value={ingestion?.embeddingsReady ? 'Completed' : 'Pending'}
            />
            <MetaRow
              label="Semantic State"
              value={ingestion?.currentStage ?? 'Stable'}
            />
            <MetaRow
              label="Source Connector"
              value={document.sourceType ?? 'Direct'}
            />
          </div>

          {ingestion?.ingestionError && (
            <div className="p-4 rounded-xl border border-red-100 bg-red-50/50 dark:bg-red-500/5 dark:border-red-500/10 text-xs text-red-600 dark:text-red-400 flex items-start gap-3">
              <X className="size-4 shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed italic">
                Error Trace: {ingestion.ingestionError}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-8">
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold">Document Lifecycle</h3>
            <p className="text-sm text-muted-foreground">
              History and system-level metadata.
            </p>
          </div>
          
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden divide-y divide-border/50">
            <MetaRow
              label="Created"
              value={new Date(document.createdAt).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            />
            <MetaRow
              label="Last Modified"
              value={new Date(document.updatedAt).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            />
            <MetaRow
              label="Last Read"
              value={
                document.lastOpenedAt
                  ? new Date(document.lastOpenedAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : 'Never'
              }
            />
          </div>
        </div>

        {Object.keys(document.metadata).length > 0 && (
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
              Raw Metadata
            </p>
            <div className="rounded-2xl border bg-muted/20 p-6">
              <ScrollArea className="h-[240px] w-full">
                <pre className="text-[12px] leading-relaxed font-mono opacity-80">
                  {JSON.stringify(document.metadata, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
