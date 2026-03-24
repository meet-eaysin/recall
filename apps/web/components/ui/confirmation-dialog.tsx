'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

type ConfirmationDialogProps = {
  cancelLabel?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  description: React.ReactNode;
  isPending?: boolean;
  confirmAction: () => void | Promise<void>;
  openChangeAction?: (open: boolean) => void;
  open?: boolean;
  title: React.ReactNode;
  tone?: 'default' | 'destructive';
  trigger?: React.ReactElement;
};

export function ConfirmationDialog({
  cancelLabel = 'Cancel',
  children,
  confirmLabel = 'Confirm',
  description,
  isPending = false,
  confirmAction,
  openChangeAction,
  open: controlledOpen,
  title,
  tone = 'default',
  trigger,
}: ConfirmationDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  function setOpen(nextOpen: boolean) {
    if (!isControlled) {
      setUncontrolledOpen(nextOpen);
    }
    openChangeAction?.(nextOpen);
  }

  async function handleConfirm() {
    await confirmAction();
    setOpen(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      ) : null}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel variant="ghost">{cancelLabel}</AlertDialogCancel>
          <Button
            disabled={isPending}
            onClick={() => void handleConfirm()}
            variant={tone === 'destructive' ? 'destructive' : 'default'}
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
