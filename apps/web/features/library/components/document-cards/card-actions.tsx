'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, Link2, Trash2, MoreHorizontal } from 'lucide-react';
import {
  Menu,
  MenuTrigger,
  MenuPopup,
  MenuItem,
  MenuSeparator,
} from '@/components/ui/menu';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import type { DocumentRow } from '../../types';
import { useDeleteDocument } from '../../hooks';

interface CardActionsProps {
  document: DocumentRow;
}

export function CardActions({ document }: CardActionsProps) {
  const router = useRouter();
  const deleteDocument = useDeleteDocument();
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  function handleCopyLink(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const url = `${window.location.origin}/library/${document.id}`;
    void navigator.clipboard.writeText(url);
  }

  function handleOpenSource(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (document.sourceUrl) {
      window.open(document.sourceUrl, '_blank', 'noopener,noreferrer');
    }
  }

  async function handleDelete() {
    await deleteDocument.mutateAsync(document.id);
    router.push('/app/library');
  }

  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            aria-label="Open document actions"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        }
      />
      <MenuPopup side="bottom" align="end">
        {document.sourceUrl && (
          <MenuItem onClick={handleOpenSource}>
            <ExternalLink className="size-4" />
            Open source
          </MenuItem>
        )}
        <MenuItem onClick={handleCopyLink}>
          <Link2 className="size-4" />
          Copy link
        </MenuItem>
        <MenuSeparator />
        <MenuItem
          variant="destructive"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setDeleteOpen(true);
          }}
        >
          <Trash2 className="size-4" />
          Delete
        </MenuItem>
      </MenuPopup>

      <ConfirmationDialog
        open={deleteOpen}
        openChangeAction={setDeleteOpen}
        confirmAction={handleDelete}
        isPending={deleteDocument.isPending}
        title="Delete document?"
        description={`This will permanently delete "${document.title}" and remove its related data.`}
        confirmLabel="Delete document"
        tone="destructive"
      />
    </Menu>
  );
}
