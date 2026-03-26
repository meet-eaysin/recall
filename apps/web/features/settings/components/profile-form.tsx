'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldError,
} from '@/components/ui/field';
import { useCurrentUser } from '../hooks';
import { settingsApi } from '../api';
import { toast } from 'sonner';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  avatarUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { data: user, refetch } = useCurrentUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      avatarUrl: user?.avatarUrl || '',
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || '',
        email: user.email || '',
        avatarUrl: user.avatarUrl || '',
      });
    }
  }, [user, form]);

  async function onSubmit(data: ProfileFormValues) {
    setIsSubmitting(true);
    try {
      await settingsApi.updateUser(data);
      await refetch();
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Field>
        <FieldLabel>Name</FieldLabel>
        <Input placeholder="Your name" {...form.register('name')} />
        <FieldDescription>This is your public display name.</FieldDescription>
        {form.formState.errors.name && (
          <FieldError>{form.formState.errors.name.message}</FieldError>
        )}
      </Field>

      <Field>
        <FieldLabel>Email</FieldLabel>
        <Input placeholder="Your email" {...form.register('email')} disabled />
        <FieldDescription>
          Email is managed via your identity provider.
        </FieldDescription>
        {form.formState.errors.email && (
          <FieldError>{form.formState.errors.email.message}</FieldError>
        )}
      </Field>

      <Field>
        <FieldLabel>Avatar URL</FieldLabel>
        <Input
          placeholder="https://example.com/avatar.png"
          {...form.register('avatarUrl')}
        />
        <FieldDescription>Link to your profile picture.</FieldDescription>
        {form.formState.errors.avatarUrl && (
          <FieldError>{form.formState.errors.avatarUrl.message}</FieldError>
        )}
      </Field>

      <div className="flex justify-end pt-4 border-t border-border/40">
        <Button
          type="submit"
          disabled={isSubmitting || !form.formState.isDirty}
          className="rounded-lg shadow-sm px-8"
        >
          {isSubmitting ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
