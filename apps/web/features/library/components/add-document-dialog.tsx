'use client';

import * as React from 'react';
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { AddDocumentForm } from './add-document-form';

export function AddDocumentDialog() {
  const [open, setOpen] = React.useState(false);
  const formId = React.useId();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon aria-hidden="true" />
          Add Document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add to Library</DialogTitle>
          <DialogDescription>
            Save a new link, upload a PDF, or create a note.
          </DialogDescription>
        </DialogHeader>
        <AddDocumentForm
          formId={formId}
          hideActions
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button form={formId} type="submit">
            Add to Library
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
