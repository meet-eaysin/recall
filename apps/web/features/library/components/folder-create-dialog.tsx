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
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useCreateFolder } from '../hooks';

export function FolderCreateDialog() {
  const [color, setColor] = React.useState('');
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
    setColor('');
    setOpen(false);
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button variant="outline">New Folder</Button>} />
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
              <FieldLabel htmlFor="folder-color">Color</FieldLabel>
              <Input
                id="folder-color"
                onChange={(event) => setColor(event.target.value)}
                placeholder="#2563eb"
                value={color}
              />
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
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}
