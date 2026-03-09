'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { DocumentStatus, IngestionStatus } from '@repo/types';
import {
  ArrowUpRight,
  Brain,
  Check,
  ChevronLeft,
  Clock,
  FileText,
  LoaderCircle,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  PencilLine,
  RefreshCcw,
  Sparkles,
  StickyNote,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { PageBreadcrumbs } from '@/components/shell/page-breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  useCreateNote,
  useDeleteDocument,
  useDeleteNote,
  useDeleteSummary,
  useDocument,
  useDocumentIngestion,
  useDocumentTranscript,
  useFolders,
  useGenerateSummary,
  useGenerateTranscript,
  useNotes,
  useRetryIngestion,
  useUpdateDocument,
  useUpdateNote,
} from '../hooks';
import {
  DocumentPreviewSurface,
  DocumentPreviewUnavailable,
} from './document-preview-surface';
import {
  getStatusBadgeVariant,
  getStatusLabel,
  getTypeLabel,
} from '../utils/document-helpers';

const STATUS_OPTIONS = Object.values(DocumentStatus);

export function DocumentDetailView({ id }: { id: string }) {
  const router = useRouter();
  const [noteDraft, setNoteDraft] = React.useState('');
  const [editingNoteId, setEditingNoteId] = React.useState<string | null>(null);
  const [editingNoteDraft, setEditingNoteDraft] = React.useState('');
  const [readerExpanded, setReaderExpanded] = React.useState(false);

  const { data: document, error, isLoading } = useDocument(id);
  const { data: ingestion } = useDocumentIngestion(id);
  const { data: transcriptResponse, error: transcriptError } = useDocumentTranscript(id);
  const { data: notes = [] } = useNotes(id);
  const { data: folders = [] } = useFolders();
  const updateDocument = useUpdateDocument(id);
  const generateSummary = useGenerateSummary(id);
  const deleteSummary = useDeleteSummary(id);
  const generateTranscript = useGenerateTranscript(id);
  const retryIngestion = useRetryIngestion(id);
  const createNote = useCreateNote(id);
  const deleteDocument = useDeleteDocument();
  const deleteNote = useDeleteNote(id);
  const updateNote = useUpdateNote(id);

  const folder = folders.find((item) => item.id === document?.folderId);

  async function handleDeleteDocument() {
    if (!document) return;
    if (!window.confirm(`Delete "${document.title}"?`)) return;
    await deleteDocument.mutateAsync(document.id);
    router.push('/library');
  }

  async function handleCreateNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = noteDraft.trim();
    if (!content) return;
    await createNote.mutateAsync({ content, documentId: id });
    setNoteDraft('');
  }

  function handleStartEditingNote(noteId: string, content: string) {
    setEditingNoteId(noteId);
    setEditingNoteDraft(content);
  }

  function handleCancelEditingNote() {
    setEditingNoteId(null);
    setEditingNoteDraft('');
  }

  async function handleSaveNote(noteId: string) {
    const content = editingNoteDraft.trim();
    if (!content) return;
    await updateNote.mutateAsync({ id: noteId, content });
    handleCancelEditingNote();
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-7 w-1/2" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-[600px] w-full rounded-2xl mt-5" />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !document) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md w-full border-dashed">
          <CardContent className="p-10">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Document not available</EmptyTitle>
                <EmptyDescription>
                  {(error as Error | undefined)?.message ?? 'The document could not be loaded.'}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button render={<Link href="/library" />} variant="outline" size="sm">
                  <ChevronLeft className="size-4" />
                  Back to Library
                </Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasContent = !!(document.sourceUrl || document.content);

  // ── Main ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <PageBreadcrumbs
        current={document.title}
        items={[
          { href: '/library', label: 'Library' },
          ...(folder ? [{ label: folder.name }] : []),
        ]}
      />

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          {/* Title */}
          <h1 className="text-xl font-semibold tracking-tight leading-snug">
            {document.title}
          </h1>

          {/* Meta pills */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={getStatusBadgeVariant(document.status)}
              className="rounded-full px-2.5 py-0.5 text-xs"
            >
              {getStatusLabel(document.status)}
            </Badge>
            {document.type && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <FileText className="size-3 opacity-60" />
                {getTypeLabel(document.type)}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3 opacity-60" />
              Updated {formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          <Select
            onValueChange={(value) => updateDocument.mutate({ status: value as DocumentStatus })}
            value={document.status}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue>{getStatusLabel(document.status)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status} className="text-xs">
                  {getStatusLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Menu>
            <MenuTrigger
              render={
                <Button size="icon-sm" variant="outline">
                  <MoreHorizontal className="size-4" />
                </Button>
              }
            />
            <MenuPopup align="end" className="w-44">
              {document.sourceUrl && (
                <MenuItem
                  render={<a href={document.sourceUrl} rel="noreferrer" target="_blank" />}
                >
                  <ArrowUpRight className="size-4" />
                  Open Source
                </MenuItem>
              )}
              <MenuSeparator />
              <MenuItem onClick={handleDeleteDocument} variant="destructive">
                <Trash2 className="size-4" />
                Delete Document
              </MenuItem>
            </MenuPopup>
          </Menu>
        </div>
      </div>

      {/* ── Content grid ── */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">

        {/* ── Left column ── */}
        <div className="space-y-5">

          {/* ── Document reader — no card chrome, just immersive content ── */}
          <div
            className={`group relative overflow-hidden border bg-background shadow-sm transition-all duration-300 ${
              readerExpanded ? 'ring-2 ring-ring/50' : ''
            }`}
          >
            {/* Floating toolbar — only visible on hover */}
            <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              {document.sourceUrl && (
                <a href={document.sourceUrl} rel="noreferrer" target="_blank">
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    className="h-7 w-7 shadow-sm backdrop-blur-sm"
                  >
                    <ArrowUpRight className="size-3.5" />
                  </Button>
                </a>
              )}
              <Button
                size="icon-sm"
                variant="secondary"
                className="h-7 w-7 shadow-sm backdrop-blur-sm"
                onClick={() => setReaderExpanded((v) => !v)}
              >
                {readerExpanded ? (
                  <Minimize2 className="size-3.5" />
                ) : (
                  <Maximize2 className="size-3.5" />
                )}
              </Button>
            </div>

            {/* The document itself */}
            <div
              className={`w-full transition-all duration-300 ${
                readerExpanded
                  ? 'h-[calc(100vh-7rem)] min-h-[82vh]'
                  : 'h-[clamp(32rem,72vh,56rem)]'
              }`}
            >
              {hasContent ? (
                <DocumentPreviewSurface document={document} />
              ) : (
                <DocumentPreviewUnavailable sourceUrl={document.sourceUrl} />
              )}
            </div>
          </div>


          {/* ── Notes ── */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between gap-3 px-5 py-4">
              <div>
                <CardTitle className="text-sm font-semibold">Notes</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Keep working notes beside the source
                </p>
              </div>
              {notes.length > 0 && (
                <Badge variant="secondary" className="rounded-full tabular-nums text-xs">
                  {notes.length}
                </Badge>
              )}
            </CardHeader>
            <Separator />
            <CardContent className="space-y-5 px-5 py-5">
              {/* Composer */}
              <form
                onSubmit={handleCreateNote}
                className="space-y-4 rounded-2xl bg-muted/10 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                    <StickyNote className="size-3.5" />
                    Quick note
                  </div>
                  <span className="text-[11px] text-muted-foreground">Ctrl/Cmd + Enter to save</span>
                </div>
                <Textarea
                  onChange={(e) => setNoteDraft(e.target.value)}
                  onKeyDown={(event) => {
                    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                      event.preventDefault();
                      const form = event.currentTarget.form;
                      form?.requestSubmit();
                    }
                  }}
                  placeholder="Capture a takeaway, next step, or reference while you read..."
                  value={noteDraft}
                  className="min-h-[120px] rounded-xl border-border/60 bg-background/80 text-sm shadow-none"
                />
                <div className="flex items-end justify-between gap-4">
                  <p className="max-w-xl text-xs leading-5 text-muted-foreground">
                    Notes are saved to your workspace and stay attached to this document.
                  </p>
                  <Button
                    size="sm"
                    className="h-8 shrink-0 gap-1.5 rounded-lg px-3 text-xs"
                    disabled={!noteDraft.trim() || createNote.isPending}
                  >
                    {createNote.isPending ? (
                      <LoaderCircle className="size-3 animate-spin" />
                    ) : (
                      <StickyNote className="size-3" />
                    )}
                    {createNote.isPending ? 'Saving…' : 'Add Note'}
                  </Button>
                </div>
              </form>

              {/* Notes list */}
              {notes.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 py-10 text-center">
                  <div className="rounded-full bg-muted p-3">
                    <StickyNote className="size-4 text-muted-foreground/50" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground/80">No notes yet</p>
                    <p className="text-xs text-muted-foreground">
                      Start with a quick takeaway or an action item from this document.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {notes.map((note) => (
                    <article
                      key={note.id}
                      className="group/note rounded-2xl border border-border/70 bg-background p-4 shadow-sm transition-colors hover:bg-muted/10"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                            Note
                          </p>
                          <span className="text-[11px] text-muted-foreground">
                            {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/note:opacity-100">
                          {editingNoteId === note.id ? (
                            <>
                              <Button
                                onClick={() => void handleSaveNote(note.id)}
                                size="sm"
                                variant="ghost"
                                className="h-7 gap-1.5 px-2 text-xs"
                                disabled={!editingNoteDraft.trim() || updateNote.isPending}
                              >
                                {updateNote.isPending ? (
                                  <LoaderCircle className="size-3 animate-spin" />
                                ) : (
                                  <Check className="size-3" />
                                )}
                                Save
                              </Button>
                              <Button
                                onClick={handleCancelEditingNote}
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-muted-foreground"
                                disabled={updateNote.isPending}
                              >
                                <X className="size-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                onClick={() => handleStartEditingNote(note.id, note.content)}
                                size="sm"
                                variant="ghost"
                                className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
                              >
                                <PencilLine className="size-3" />
                                Edit
                              </Button>
                              <Button
                                onClick={() => deleteNote.mutate(note.id)}
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {editingNoteId === note.id ? (
                        <div className="mt-3 space-y-2">
                          <Textarea
                            value={editingNoteDraft}
                            onChange={(event) => setEditingNoteDraft(event.target.value)}
                            onKeyDown={(event) => {
                              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                                event.preventDefault();
                                void handleSaveNote(note.id);
                              }
                              if (event.key === 'Escape') {
                                event.preventDefault();
                                handleCancelEditingNote();
                              }
                            }}
                            className="min-h-[112px] resize-none text-sm"
                          />
                          <p className="text-[11px] text-muted-foreground">
                            Press Esc to cancel or Ctrl/Cmd + Enter to save.
                          </p>
                        </div>
                      ) : (
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
                          {note.content}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

                    {/* ── Summary ── */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between gap-3 px-5 py-4">
              <div>
                <CardTitle className="text-sm font-semibold">Summary</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">AI-generated overview</p>
              </div>
              <div className="flex items-center gap-1.5">
                {document.summary && (
                  <Button
                    onClick={() => deleteSummary.mutate(id)}
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-muted-foreground"
                  >
                    Remove
                  </Button>
                )}
                <Button
                  onClick={() => generateSummary.mutate(id)}
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1.5 text-xs"
                >
                  {generateSummary.isPending ? (
                    <LoaderCircle className="size-3 animate-spin" />
                  ) : (
                    <Sparkles className="size-3" />
                  )}
                  Generate
                </Button>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="px-5 py-4">
              {document.summary ? (
                <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
                  {document.summary}
                </p>
              ) : (
                <div className="flex flex-col items-center gap-2.5 py-8 text-center">
                  <div className="rounded-full bg-muted p-3">
                    <Sparkles className="size-5 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No summary yet</p>
                  <p className="text-xs text-muted-foreground/60">
                    Click Generate to create an AI summary
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* ── Right column ── */}
        <div className="space-y-4">

          {/* ── Transcript ── */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between gap-3 px-5 py-4">
              <div>
                <CardTitle className="text-sm font-semibold">Transcript</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">Extracted text content</p>
              </div>
              <Button
                onClick={() => generateTranscript.mutate(id)}
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 text-xs"
              >
                {generateTranscript.isPending ? (
                  <LoaderCircle className="size-3 animate-spin" />
                ) : (
                  <Brain className="size-3" />
                )}
                Generate
              </Button>
            </CardHeader>
            <Separator />
            <CardContent className="px-5 py-4">
              {transcriptResponse?.content ? (
                <div className="max-h-64 overflow-y-auto rounded-lg bg-muted/40 px-3 py-3">
                  <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {transcriptResponse.content}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2.5 py-6 text-center">
                  <div className="rounded-full bg-muted p-2.5">
                    <Brain className="size-4 text-muted-foreground/50" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {transcriptError
                      ? 'Transcript unavailable for this document.'
                      : 'No transcript generated yet.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Details ── */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between gap-3 px-5 py-4">
              <div>
                <CardTitle className="text-sm font-semibold">Details</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">Ingestion & metadata</p>
              </div>
              <Button
                onClick={() => retryIngestion.mutate(id)}
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 text-xs"
              >
                {retryIngestion.isPending ? (
                  <LoaderCircle className="size-3 animate-spin" />
                ) : (
                  <RefreshCcw className="size-3" />
                )}
                Retry
              </Button>
            </CardHeader>
            <Separator />
            <CardContent className="px-5 py-4 space-y-3">
              {/* Ingestion status */}
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Zap className="size-3" />
                  Ingestion
                </span>
                <span
                  className={`text-xs font-medium ${
                    ingestion?.ingestionStatus === IngestionStatus.COMPLETED
                      ? 'text-green-600 dark:text-green-400'
                      : ingestion?.ingestionStatus === IngestionStatus.FAILED
                      ? 'text-destructive'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {ingestion?.ingestionStatus ?? 'Unknown'}
                </span>
              </div>

              <div className="divide-y divide-border/50">
                <MetaRow label="Embeddings" value={ingestion?.embeddingsReady ? 'Ready' : 'Pending'} />
                <MetaRow label="Source type" value={document.sourceType ?? '—'} />
                <MetaRow label="Created" value={new Date(document.createdAt).toLocaleString()} />
                <MetaRow label="Updated" value={new Date(document.updatedAt).toLocaleString()} />
                <MetaRow
                  label="Last opened"
                  value={
                    document.lastOpenedAt
                      ? new Date(document.lastOpenedAt).toLocaleString()
                      : 'Not tracked'
                  }
                />
              </div>

              {ingestion?.currentStage && (
                <p className="text-xs text-muted-foreground">{ingestion.currentStage}</p>
              )}

              {ingestion?.ingestionError && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {ingestion.ingestionError}
                </div>
              )}

              {Object.keys(document.metadata).length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Metadata
                  </p>
                  <pre className="overflow-x-auto rounded-lg bg-muted px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
                    {JSON.stringify(document.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="max-w-[58%] wrap-break-word text-right text-xs">{value}</span>
    </div>
  );
}
