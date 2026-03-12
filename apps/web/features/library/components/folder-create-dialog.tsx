'use client';

import * as React from 'react';
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPanel,
  DialogPopup,
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
  { label: 'Blue', value: '#2563eb' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Amber', value: '#d97706' },
  { label: 'Rose', value: '#e11d48' },
  { label: 'Violet', value: '#7c3aed' },
  { label: 'Slate', value: '#475569' },
] as const;

interface FolderCreateDialogProps {
  trigger?: React.ReactElement;
}

export function FolderCreateDialog({ trigger }: FolderCreateDialogProps) {
  const [color, setColor] = React.useState<string>(FOLDER_COLORS[0].value);
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
    setColor(FOLDER_COLORS[0].value);
    setOpen(false);
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={trigger ?? <Button variant="outline">New Folder</Button>}
      />
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Folder</DialogTitle>
          <DialogDescription>
            Add a folder to organize related documents.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <form className="space-y-4" onSubmit={handleSubmit}>
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
              <div className="flex flex-wrap gap-2">
                {FOLDER_COLORS.map((option) => {
                  const isActive = color === option.value;

                  return (
                    <Button
                      aria-pressed={isActive}
                      className="gap-2"
                      key={option.value}
                      onClick={() => setColor(option.value)}
                      type="button"
                      variant={isActive ? 'default' : 'outline'}
                    >
                      <span
                        aria-hidden="true"
                        className="size-3 rounded-full"
                        style={{ backgroundColor: option.value }}
                      />
                      {option.label}
                    </Button>
                  );
                })}
              </div>
              <FieldDescription>Select a folder color.</FieldDescription>
            </Field>

            {mutation.error && (
              <FieldError>{mutation.error.message}</FieldError>
            )}

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
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}
