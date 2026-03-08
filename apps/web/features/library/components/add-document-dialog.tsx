'use client';

import * as React from 'react';
import {
  Dialog,
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

  // We can intercept the opening or form interactions if needed.
  // The user requested that if 'TEXT' is selected, it routes to a new page.
  // For now, the user flow will be handled inside the form for type selection vs route.

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Document
          </Button>
        }
      />
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add to Library</DialogTitle>
          <DialogDescription>
            Save a new link, upload a PDF, or create a note.
          </DialogDescription>
        </DialogHeader>
        <AddDocumentForm
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
