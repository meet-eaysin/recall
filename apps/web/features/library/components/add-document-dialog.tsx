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
        <Button size="sm">
          <PlusIcon className="size-4" aria-hidden="true" />
          Add Document
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[580px] gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/60">
          <DialogTitle className="text-[15px] font-semibold leading-none">
            Add to library
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1.5">
            Save a link, PDF, image, or write a note.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5">
          <AddDocumentForm
            formId={formId}
            hideActions
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </div>

        <DialogFooter className="px-6 py-3 border-t border-border/60 bg-muted/40 flex flex-row items-center justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs px-3.5">
              Cancel
            </Button>
          </DialogClose>
          <Button
            form={formId}
            type="submit"
            size="sm"
            className="h-8 text-xs px-4"
          >
            Add to library
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
