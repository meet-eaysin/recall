'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useCreateFolder } from '../hooks';

const FOLDER_COLORS = [
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#22c55e', // Green
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#64748b', // Slate
];

interface FolderCreateDialogProps {
  trigger?: React.ReactElement;
}

export function FolderCreateDialog({ trigger }: FolderCreateDialogProps) {
  const [color, setColor] = React.useState<string>(FOLDER_COLORS[0]!);
  const [name, setName] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const mutation = useCreateFolder();

  const canSubmit = name.trim().length > 0 && !mutation.isPending;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    await mutation.mutateAsync({
      color: color.trim() || undefined,
      name: name.trim(),
    });

    setName('');
    setColor(FOLDER_COLORS[0]!);
    setOpen(false);
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline">New Folder</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Folder</DialogTitle>
          <DialogDescription>
            Add a folder to organize related documents.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <Field>
            <FieldLabel htmlFor="folder-name">Name</FieldLabel>
            <Input
              id="folder-name"
              maxLength={100}
              onChange={(event) => setName(event.target.value)}
              placeholder="Reading queue"
              value={name}
            />
          </Field>

          <Field>
            <FieldLabel>Color</FieldLabel>
            <div className="flex flex-wrap gap-2 pt-1">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={[
                    'size-8 rounded-full border-2 transition-all hover:scale-110',
                    color === c ? 'border-primary ring-2 ring-primary/20' : 'border-transparent',
                  ].join(' ')}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
            <FieldDescription>Select a folder color.</FieldDescription>
          </Field>

          {mutation.error && <FieldError>{mutation.error.message}</FieldError>}

          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={!canSubmit} type="submit">
              {mutation.isPending ? 'Creating...' : 'Create Folder'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
