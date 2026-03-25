'use client';

import * as React from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MentionTextarea } from '@/features/library/components/mention-textarea';
import { DocumentType } from '@repo/types';
import { cn } from '@/lib/utils';
import { libraryApi } from '../api';
import { useFolders } from '../hooks';
import {
  FileImageIcon,
  FileTextIcon,
  LinkIcon,
  NotebookPenIcon,
  PlayCircleIcon,
} from 'lucide-react';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  folderId: z.string().optional(),
  source: z
    .string()
    .trim()
    .min(1, 'Source URL is required')
    .url('Enter a valid URL'),
  title: z.string().trim().min(1, 'Title is required'),
  type: z.nativeEnum(DocumentType),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const resolver: Resolver<FormValues> = async (values) => {
  const result = schema.safeParse(values);
  if (result.success) return { values: result.data, errors: {} };

  const errors = result.error.issues.reduce<
    Record<string, { message: string; type: string }>
  >((acc, issue) => {
    const path = issue.path[0];
    if (path && typeof path === 'string') {
      acc[path] = { message: issue.message, type: issue.code };
    }
    return acc;
  }, {});
  return { values: {}, errors };
};

// ─── Document type items ──────────────────────────────────────────────────────

const TYPE_ITEMS = [
  {
    label: 'Article',
    value: DocumentType.URL,
    icon: LinkIcon,
    placeholder: 'https://example.com/article',
  },
  {
    label: 'YouTube',
    value: DocumentType.YOUTUBE,
    icon: PlayCircleIcon,
    placeholder: 'https://youtube.com/watch?v=...',
  },
  {
    label: 'PDF',
    value: DocumentType.PDF,
    icon: FileTextIcon,
    placeholder: 'https://example.com/file.pdf',
  },
  {
    label: 'Image',
    value: DocumentType.IMAGE,
    icon: FileImageIcon,
    placeholder: 'https://example.com/image.jpg',
  },
  {
    label: 'Note',
    value: DocumentType.TEXT,
    icon: NotebookPenIcon,
    placeholder: '',
  },
] as const;

// ─── Field label component ────────────────────────────────────────────────────

function Label({
  htmlFor,
  children,
  optional,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-1.5"
    >
      {children}
      {optional && (
        <span className="text-[10px] normal-case tracking-normal font-normal text-muted-foreground/50">
          optional
        </span>
      )}
    </label>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddDocumentFormProps {
  formId?: string;
  hideActions?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AddDocumentForm({
  formId,
  hideActions = false,
  onSuccess,
  onCancel,
}: AddDocumentFormProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver,
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      source: '',
      title: '',
      type: DocumentType.URL,
      notes: '',
      folderId: undefined,
    },
  });

  const { data: folders = [] } = useFolders();

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await libraryApi.createDocument({
        folderIds: values.folderId ? [values.folderId] : undefined,
        source: values.source,
        title: values.title,
        type: values.type,
      });
      const noteContent = values.notes?.trim();
      if (noteContent) {
        await libraryApi.createNote({
          content: noteContent,
          documentId: res.document.id,
        });
      }
      return res;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LIBRARY.ROOT });
      onSuccess?.();
    },
    onError: (error) => {
      if (!(error instanceof ApiError) || !error.details?.length) return;
      error.details.forEach((detail) => {
        const field = detail.field as keyof FormValues;
        if (!['source', 'title', 'type', 'notes', 'folderId'].includes(field))
          return;
        const msg = detail.messages[0];
        if (msg) form.setError(field, { type: 'server', message: msg });
      });
    },
  });

  const selectedType = form.watch('type');
  const selectedFolderId = form.watch('folderId');
  const selectedFolderName =
    folders.find((f) => f.id === selectedFolderId)?.name ?? 'No folder';
  const currentItem = TYPE_ITEMS.find((t) => t.value === selectedType);

  const touched = (name: keyof FormValues) =>
    form.formState.submitCount > 0 || form.getFieldState(name).isTouched;

  const sourceError = touched('source')
    ? form.formState.errors.source
    : undefined;
  const titleError = touched('title') ? form.formState.errors.title : undefined;
  const notesError = touched('notes') ? form.formState.errors.notes : undefined;
  const canSubmit = form.formState.isValid && !mutation.isPending;

  const handleTypeSelect = (
    next: DocumentType,
    onChange: (v: DocumentType) => void,
  ) => {
    if (next === DocumentType.TEXT) {
      onCancel?.();
      router.push('/app/library/new?type=text');
    } else {
      onChange(next);
    }
  };

  const trimOnBlur = (name: keyof FormValues) => ({
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      const trimmed = e.target.value.trim();
      if (trimmed !== e.target.value) {
        form.setValue(name, trimmed, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }
    },
  });

  return (
    <Form
      id={formId}
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
    >
      {/* ── Type ── */}
      <div>
        <Label>Type</Label>
        <Controller
          name="type"
          control={form.control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-1.5">
              {TYPE_ITEMS.map(({ label, value, icon: Icon }) => {
                const active = field.value === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleTypeSelect(value, field.onChange)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5',
                      'text-[13px] font-medium leading-none',
                      'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                      'transition-[border-color,background-color,color] duration-100',
                      active
                        ? 'border-primary/60 bg-primary/8 text-primary'
                        : 'border-border/60 bg-background text-muted-foreground hover:border-border hover:text-foreground hover:bg-accent/50',
                    )}
                  >
                    <Icon className="size-3.5 shrink-0" aria-hidden />
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        />
      </div>

      {/* ── Source URL (hidden for Note) ── */}
      {selectedType !== DocumentType.TEXT && (
        <div>
          <Label htmlFor="add-doc-source">Source URL</Label>
          <Input
            id="add-doc-source"
            type="url"
            placeholder={currentItem?.placeholder}
            aria-invalid={sourceError ? 'true' : undefined}
            className="h-9 text-sm"
            {...form.register('source', trimOnBlur('source'))}
          />
          {sourceError && (
            <p className="mt-1.5 text-xs text-destructive">
              {sourceError.message}
            </p>
          )}
        </div>
      )}

      {/* ── Title + Folder ── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="add-doc-title">Title</Label>
          <Input
            id="add-doc-title"
            placeholder="e.g. Next.js 15 Release Notes"
            aria-invalid={titleError ? 'true' : undefined}
            className="h-9 text-sm"
            {...form.register('title', trimOnBlur('title'))}
          />
          {titleError && (
            <p className="mt-1.5 text-xs text-destructive">
              {titleError.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="add-doc-folder" optional>
            Folder
          </Label>
          <Controller
            name="folderId"
            control={form.control}
            render={({ field }) => (
              <Select
                value={field.value ?? 'none'}
                onValueChange={(v) =>
                  field.onChange(v === 'none' ? undefined : v)
                }
              >
                <SelectTrigger id="add-doc-folder" className="h-9 text-sm">
                  <SelectValue>{selectedFolderName}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No folder</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {/* ── Notes ── */}
      <div>
        <Label htmlFor="add-doc-notes" optional>
          Notes
        </Label>
        <Controller
          name="notes"
          control={form.control}
          render={({ field }) => (
            <MentionTextarea
              {...field}
              id="add-doc-notes"
              aria-invalid={notesError ? 'true' : undefined}
              placeholder="Type @ to mention documents or add context…"
              className="min-h-[72px] resize-none text-sm"
              value={field.value ?? ''}
            />
          )}
        />
        {notesError && (
          <p className="mt-1.5 text-xs text-destructive">
            {notesError.message}
          </p>
        )}
      </div>

      {/* ── Mutation-level error ── */}
      {mutation.error &&
        !(
          mutation.error instanceof ApiError && mutation.error.details?.length
        ) && (
          <p className="text-xs text-destructive">{mutation.error.message}</p>
        )}

      {/* ── Inline actions (when parent dialog is not handling them) ── */}
      {!hideActions && (
        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            className="h-8 text-xs"
            disabled={!canSubmit}
          >
            {mutation.isPending ? 'Adding…' : 'Add to library'}
          </Button>
        </div>
      )}
    </Form>
  );
}
