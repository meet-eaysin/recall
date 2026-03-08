'use client';

import * as React from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form } from '@/components/ui/form';
import { MentionTextarea } from '@/features/library/components/mention-textarea';
import { Controller } from 'react-hook-form';
import {
  Field,
  FieldControl,
  FieldLabel,
  FieldError,
} from '@/components/ui/field';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { DocumentType } from '@repo/types';

const addDocumentSchema = z.object({
  source: z.string().url('Must be a valid URL'),
  title: z.string().min(1, 'Title is required'),
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

export function AddDocumentForm({
  onSuccess,
  onCancel,
}: {
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const form = useForm<AddDocumentFormValues>({
    resolver: customZodResolver,
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

  const handleTypeChange = (val: DocumentType) => {
    if (val === DocumentType.TEXT) {
      if (onCancel) onCancel();
      router.push('/documents/new?type=text');
    } else {
      form.setValue('type', val);
    }
  };

  return (
    <Form className="max-w-2xl mt-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-6">
        <Field className="space-y-2">
          <FieldLabel>Document Type</FieldLabel>
          <FieldControl render={<div className="w-full" />}>
            <Select
              value={form.watch('type')}
              onValueChange={(val) => handleTypeChange(val as DocumentType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(DocumentType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldControl>
          {form.formState.errors.type && (
            <FieldError>{form.formState.errors.type.message}</FieldError>
          )}
        </Field>

        <Field className="space-y-2">
          <FieldLabel>Source URL</FieldLabel>
          <FieldControl render={<div className="w-full" />}>
            <Input placeholder="https://..." {...form.register('source')} />
          </FieldControl>
          {form.formState.errors.source && (
            <FieldError>{form.formState.errors.source.message}</FieldError>
          )}
        </Field>

        <Field className="space-y-2">
          <FieldLabel>Title</FieldLabel>
          <FieldControl render={<div className="w-full" />}>
            <Input
              placeholder="e.g. Next.js 15 Release Notes"
              {...form.register('title')}
            />
          </FieldControl>
          {form.formState.errors.title && (
            <FieldError>{form.formState.errors.title.message}</FieldError>
          )}
        </Field>

        <Field className="space-y-2">
          <FieldLabel>Related Notes & Mentions</FieldLabel>
          <FieldControl render={<div className="w-full" />}>
            <Controller
              name="notes"
              control={form.control}
              render={({ field }) => (
                <MentionTextarea
                  {...field}
                  placeholder="Type @ to link other documents, knowledge, or relations..."
                  className="resize-y"
                  value={field.value ?? ''}
                />
              )}
            />
          </FieldControl>
          {form.formState.errors.notes && (
            <FieldError>{form.formState.errors.notes.message}</FieldError>
          )}
        </Field>

        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Add to Library'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onCancel && onCancel()}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Form>
  );
}
