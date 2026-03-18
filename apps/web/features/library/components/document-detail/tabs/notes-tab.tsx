'use client';

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Clock, LoaderCircle, PencilLine, StickyNote, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useDocumentDetail } from '../context';

import { cn } from '@/lib/utils';

export function NotesTab({ isCompact = false }: { isCompact?: boolean }) {
  const { id, notes, actions } = useDocumentDetail();
  const [noteDraft, setNoteDraft] = React.useState('');
  const [deletingNoteId, setDeletingNoteId] = React.useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = React.useState<string | null>(null);
  const [editingNoteDraft, setEditingNoteDraft] = React.useState('');

  async function handleCreateNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = noteDraft.trim();
    if (!content) return;
    await actions.createNote.mutateAsync({ content, documentId: id });
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
    await actions.updateNote.mutateAsync({ id: noteId, content });
    handleCancelEditingNote();
  }

  return (
    <div
      className={cn(
        'max-w-5xl mx-auto space-y-12 pb-20',
        isCompact && 'max-w-none space-y-8 pb-10',
      )}
    >
      <div className={cn('flex flex-col gap-8', isCompact && 'gap-4')}>
        <div className="space-y-1">
          <h3 className={cn('text-2xl font-bold tracking-tight', isCompact && 'text-xl')}>
            Research Notes
          </h3>
          <p className="text-muted-foreground text-sm">
            Synthesize your findings and keep track of key insights.
          </p>
        </div>

        <form
          onSubmit={handleCreateNote}
          className="group relative rounded-2xl border bg-card shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20 hover:shadow-md"
        >
          <div className={cn('p-6 pb-0', isCompact && 'p-4 pb-0')}>
            <Textarea
              onChange={(e) => setNoteDraft(e.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                  event.preventDefault();
                  const form = event.currentTarget.form;
                  form?.requestSubmit();
                }
              }}
              placeholder="Start typing your insight... (Cmd + Enter to save)"
              value={noteDraft}
              className={cn(
                'min-h-[120px] resize-none border-none bg-transparent p-0 text-lg shadow-none focus-visible:ring-0 leading-relaxed placeholder:text-muted-foreground/50',
                isCompact && 'text-base min-h-[100px]',
              )}
            />
          </div>
          <div
            className={cn(
              'mt-2 flex items-center justify-between border-t bg-muted/5 px-6 py-3 rounded-b-2xl',
              isCompact && 'px-4 py-2',
            )}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
              <Clock className="size-3" />
              Private Workspace Note
            </p>
            <Button
              disabled={!noteDraft.trim() || actions.createNote.isPending}
              size="sm"
              className={cn(
                'h-8 px-4 rounded-full font-semibold shadow-sm transition-transform active:scale-95',
                isCompact && 'h-7 text-xs px-3',
              )}
            >
              {actions.createNote.isPending ? (
                <LoaderCircle className="size-3.5 animate-spin mr-2" />
              ) : (
                <StickyNote className="size-3.5 mr-2" />
              )}
              Save Note
            </Button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        {notes.length === 0 ? (
          <div className={cn('flex flex-col items-center gap-4 py-24 text-center', isCompact && 'py-12')}>
            <div className="rounded-3xl bg-muted/30 p-8 ring-1 ring-border shadow-inner">
              <StickyNote className="size-10 text-muted-foreground/20" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground/80">
                No insights captured yet
              </p>
              <p className="text-sm text-muted-foreground max-w-[240px] leading-relaxed">
                As you read, capture important quotes or personal thoughts here.
              </p>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              'columns-1 md:columns-2 gap-6 space-y-6',
              isCompact && 'md:columns-1',
            )}
          >
            {notes.map((note) => (
              <article
                key={note.id}
                className="break-inside-avoid flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20 hover:translate-y-[-2px]"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
                    {formatDistanceToNow(new Date(note.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <Button
                      onClick={() => handleStartEditingNote(note.id, note.content)}
                      size="icon-sm"
                      variant="ghost"
                      className="h-7 w-7 rounded-full text-muted-foreground/60 hover:text-foreground"
                    >
                      <PencilLine className="size-3.5" />
                    </Button>
                    <Button
                      onClick={() => setDeletingNoteId(note.id)}
                      size="icon-sm"
                      variant="ghost"
                      className="h-7 w-7 rounded-full text-muted-foreground/60 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {editingNoteId === note.id ? (
                  <div className="space-y-4">
                    <Textarea
                      value={editingNoteDraft}
                      onChange={(event) => setEditingNoteDraft(event.target.value)}
                      autoFocus
                      className="min-h-[120px] text-base resize-none bg-muted/10"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={handleCancelEditingNote}
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-full"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => void handleSaveNote(note.id)}
                        size="sm"
                        className="h-8 rounded-full px-4"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[15px] leading-relaxed text-foreground/80 whitespace-pre-wrap font-sans-subtle">
                    {note.content}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      <ConfirmationDialog
        open={deletingNoteId !== null}
        openChangeAction={(open) => {
          if (!open) setDeletingNoteId(null);
        }}
        confirmAction={() => actions.deleteNote.mutateAsync(deletingNoteId!)}
        isPending={actions.deleteNote.isPending}
        title="Delete note?"
        description="This note will be removed permanently from the document."
        confirmLabel="Delete note"
        tone="destructive"
      />
    </div>
  );
}
