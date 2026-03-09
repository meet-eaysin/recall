'use client';

import * as React from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { MentionTextarea } from '@/features/library/components/mention-textarea';
import { Controller } from 'react-hook-form';
import { DocumentType } from '@repo/types';
import { cn } from '@/lib/utils';

const addDocumentSchema = z.object({
  source: z
    .string()
    .trim()
    .min(1, 'Source URL is required')
    .url('Enter a valid URL'),
  title: z.string().trim().min(1, 'Title is required'),
  type: z.nativeEnum(DocumentType),
  notes: z.string().optional(),
});

type AddDocumentFormValues = z.infer<typeof addDocumentSchema>;

const customZodResolver: Resolver<AddDocumentFormValues> = async (values) => {
  const result = addDocumentSchema.safeParse(values);
  if (result.success) {
    return { values: result.data, errors: {} };
  }

  const errors = result.error.issues.reduce<
    Record<string, { message: string; type: string }>
  >((acc, curr) => {
    const path = curr.path[0];
    if (path && typeof path === 'string') {
      acc[path] = { message: curr.message, type: curr.code };
    }
    return acc;
  }, {});
  return { values: {}, errors };
};

interface AddDocumentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const documentTypeItems = [
  {
    label: 'Article',
    value: DocumentType.URL,
    description: 'Web page or blog post',
  },
  {
    label: 'YouTube',
    value: DocumentType.YOUTUBE,
    description: 'Video link',
  },
  {
    label: 'PDF',
    value: DocumentType.PDF,
    description: 'Hosted PDF URL',
  },
  {
    label: 'Image',
    value: DocumentType.IMAGE,
    description: 'Image link',
  },
  {
    label: 'Note',
    value: DocumentType.TEXT,
    description: 'Open the text editor',
  },
] as const;

export function AddDocumentForm({ onSuccess, onCancel }: AddDocumentFormProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const form = useForm<AddDocumentFormValues>({
    resolver: customZodResolver,
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      source: '',
      title: '',
      type: DocumentType.URL,
      notes: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: AddDocumentFormValues) =>
      apiPost('/documents', { body: values }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (onSuccess) onSuccess();
    },
  });

  const onSubmit = (values: AddDocumentFormValues) => {
    mutation.mutate(values);
  };

  const handleTypeChange = (
    nextType: DocumentType,
    onChange: (val: DocumentType) => void,
  ) => {
    if (nextType === DocumentType.TEXT) {
      if (onCancel) onCancel();
      router.push('/documents/new?type=text');
    } else {
      onChange(nextType);
    }
  };

  const shouldShowError = (name: keyof AddDocumentFormValues) =>
    form.formState.submitCount > 0 || form.getFieldState(name).isTouched;

  const selectedType = form.watch('type');
  const sourceError = shouldShowError('source')
    ? form.formState.errors.source
    : undefined;
  const titleError = shouldShowError('title')
    ? form.formState.errors.title
    : undefined;
  const notesError = shouldShowError('notes')
    ? form.formState.errors.notes
    : undefined;
  const canSubmit = form.formState.isValid && !mutation.isPending;
  const sourcePlaceholderByType: Record<DocumentType, string> = {
    [DocumentType.URL]: 'https://example.com/article',
    [DocumentType.YOUTUBE]: 'https://youtube.com/watch?v=...',
    [DocumentType.PDF]: 'https://example.com/file.pdf',
    [DocumentType.IMAGE]: 'https://example.com/image.jpg',
    [DocumentType.TEXT]: '',
  };
  const sourceHintByType: Record<DocumentType, string> = {
    [DocumentType.URL]: 'Paste the article or page URL you want to save.',
    [DocumentType.YOUTUBE]: 'Paste the YouTube video link.',
    [DocumentType.PDF]: 'Paste a direct or hosted PDF URL.',
    [DocumentType.IMAGE]: 'Paste the image URL.',
    [DocumentType.TEXT]:
      'Use Note above if you want to write directly in the app.',
  };

  return (
    <Form className="mt-4 space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="inline-flex items-center gap-2 font-medium text-base/4.5 text-foreground sm:text-sm/4">
            Document Type
          </label>
          <div className="w-full">
            <Controller
              name="type"
              control={form.control}
              render={({ field }) => (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {documentTypeItems.map((item) => {
                    const isSelected = field.value === item.value;

                    return (
                      <Button
                        key={item.value}
                        type="button"
                        variant={isSelected ? 'default' : 'outline'}
                        className={cn(
                          'h-auto items-start justify-start px-3 py-3 text-left',
                          !isSelected && 'text-foreground',
                        )}
                        onClick={() =>
                          handleTypeChange(item.value, field.onChange)
                        }
                      >
                        <span className="flex flex-col items-start gap-1">
                          <span>{item.label}</span>
                          <span className="text-xs opacity-72">
                            {item.description}
                          </span>
                        </span>
                      </Button>
                    );
                  })}
                </div>
              )}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Pick the format you are saving. Choosing Note opens the text editor.
          </p>
        </div>

        <Field className="space-y-2">
          <FieldLabel htmlFor="add-document-source">Source URL</FieldLabel>
          <Input
            id="add-document-source"
            aria-invalid={sourceError ? 'true' : undefined}
            placeholder={sourcePlaceholderByType[selectedType]}
            type="url"
            {...form.register('source', {
              onBlur: (event) => {
                const trimmedValue = event.target.value.trim();
                if (trimmedValue !== event.target.value) {
                  form.setValue('source', trimmedValue, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  });
                }
              },
            })}
          />
          <p className="text-muted-foreground text-xs">
            {sourceHintByType[selectedType]}
          </p>
          {sourceError && <FieldError>{sourceError.message}</FieldError>}
        </Field>

        <Field className="space-y-2">
          <FieldLabel htmlFor="add-document-title">Title</FieldLabel>
          <Input
            id="add-document-title"
            aria-invalid={titleError ? 'true' : undefined}
            placeholder="e.g. Next.js 15 Release Notes"
            {...form.register('title', {
              onBlur: (event) => {
                const trimmedValue = event.target.value.trim();
                if (trimmedValue !== event.target.value) {
                  form.setValue('title', trimmedValue, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  });
                }
              },
            })}
          />
          <p className="text-muted-foreground text-xs">
            Use a short title that will be easy to scan later.
          </p>
          {titleError && <FieldError>{titleError.message}</FieldError>}
        </Field>

        <div className="space-y-2">
          <label
            className="inline-flex items-center gap-2 font-medium text-base/4.5 text-foreground sm:text-sm/4"
            htmlFor="add-document-notes"
          >
            Related Notes & Mentions
          </label>
          <div className="w-full">
            <Controller
              name="notes"
              control={form.control}
              render={({ field }) => (
                <MentionTextarea
                  {...field}
                  id="add-document-notes"
                  aria-invalid={notesError ? 'true' : undefined}
                  placeholder="Type @ to link other documents, knowledge, or relations..."
                  className="resize-y"
                  value={field.value ?? ''}
                />
              )}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Optional context, references, or linked notes.
          </p>
          {notesError && (
            <p className="text-destructive-foreground text-xs">
              {notesError.message}
            </p>
          )}
        </div>

        {mutation.error && (
          <p className="text-destructive-foreground text-xs">
            {mutation.error.message}
          </p>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          {mutation.isPending ? 'Adding...' : 'Add to Library'}
        </Button>
      </div>
    </Form>
  );
}
