'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { AddDocumentForm } from './add-document-form';

export function AddDocumentDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const formId = React.useId();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <PlusIcon className="size-4" aria-hidden="true" />
            Add Document
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add to library</DialogTitle>
          <DialogDescription>
            Save a link, PDF, image, or write a note to your knowledge base.
          </DialogDescription>
        </DialogHeader>
        <AddDocumentForm
          formId={formId}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
