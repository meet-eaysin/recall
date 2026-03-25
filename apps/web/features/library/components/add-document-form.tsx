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
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { MentionTextarea } from '@/features/library/components/mention-textarea';
import { DocumentType } from '@repo/types';
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

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddDocumentFormProps {
  formId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AddDocumentForm({
  formId,
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
      className="flex flex-col gap-0"
      onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
    >
      <DialogHeader>
        <DialogTitle>Add to library</DialogTitle>
        <DialogDescription>
          Save a link, PDF, image, or write a note to your knowledge base.
        </DialogDescription>
      </DialogHeader>

      <FieldGroup className="py-4">
        {/* ── Type Selector ── */}
        <Field>
          <FieldLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
            Type
          </FieldLabel>
          <Controller
            name="type"
            control={form.control}
            render={({ field }) => (
              <ToggleGroup
                type="single"
                variant="outline"
                className="flex flex-wrap gap-2 w-full justify-start"
                value={field.value}
                onValueChange={(val) => {
                  if (val) handleTypeSelect(val as DocumentType, field.onChange);
                }}
              >
                {TYPE_ITEMS.map(({ label, value, icon: Icon }) => (
                  <ToggleGroupItem
                    key={value}
                    value={value}
                    className="flex items-center gap-2 px-3 h-9 rounded-md border-border/50 text-xs font-medium data-[state=on]:bg-primary/5 data-[state=on]:text-primary data-[state=on]:border-primary/30"
                  >
                    <Icon className="size-3.5" />
                    {label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}
          />
        </Field>

        {/* ── Source URL (hidden for Note) ── */}
        {selectedType !== DocumentType.TEXT && (
          <Field>
            <FieldLabel
              className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80"
              htmlFor="add-doc-source"
            >
              Source URL
            </FieldLabel>
            <Input
              id="add-doc-source"
              type="url"
              placeholder={currentItem?.placeholder}
              aria-invalid={sourceError ? 'true' : undefined}
              className="h-10 text-sm"
              {...form.register('source', trimOnBlur('source'))}
            />
            {sourceError && <FieldError>{sourceError.message}</FieldError>}
          </Field>
        )}

        {/* ── Title + Folder ── */}
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel
              className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80"
              htmlFor="add-doc-title"
            >
              Title
            </FieldLabel>
            <Input
              id="add-doc-title"
              placeholder="e.g. Next.js 15 Release Notes"
              aria-invalid={titleError ? 'true' : undefined}
              className="h-10 text-sm"
              {...form.register('title', trimOnBlur('title'))}
            />
            {titleError && <FieldError>{titleError.message}</FieldError>}
          </Field>

          <Field>
            <FieldLabel
              className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80"
              htmlFor="add-doc-folder"
            >
              Folder
            </FieldLabel>
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
                  <SelectTrigger
                    id="add-doc-folder"
                    className="h-10 text-sm"
                  >
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
          </Field>
        </div>

        {/* ── Notes ── */}
        <Field>
          <FieldLabel
            className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80"
            htmlFor="add-doc-notes"
          >
            Brief Summary
          </FieldLabel>
          <Controller
            name="notes"
            control={form.control}
            render={({ field }) => (
              <MentionTextarea
                {...field}
                id="add-doc-notes"
                aria-invalid={notesError ? 'true' : undefined}
                placeholder="Type @ to mention documents or add context…"
                className="min-h-[80px] resize-none text-sm p-3 focus:bg-background"
                value={field.value ?? ''}
              />
            )}
          />
          {notesError && <FieldError>{notesError.message}</FieldError>}
        </Field>

        {/* ── Mutation-level error ── */}
        {mutation.error &&
          !(
            mutation.error instanceof ApiError && mutation.error.details?.length
          ) && <FieldError>{mutation.error.message}</FieldError>}
      </FieldGroup>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </DialogClose>
        <Button
          type="submit"
          size="sm"
          disabled={!canSubmit}
          className="min-w-[100px]"
        >
          {mutation.isPending ? 'Adding…' : 'Add to library'}
        </Button>
      </DialogFooter>
    </Form>
  );
}
