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
import type { DocumentRow } from '../../types';
import { useDeleteDocument } from '../../hooks';

interface CardActionsProps {
  document: DocumentRow;
}

export function CardActions({ document }: CardActionsProps) {
  const router = useRouter();
  const deleteDocument = useDeleteDocument();

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

  async function handleDelete(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!window.confirm(`Delete "${document.title}"?`)) return;
    await deleteDocument.mutateAsync(document.id);
    router.push('/library');
  }

  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
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
        <MenuItem variant="destructive" onClick={(event) => void handleDelete(event)}>
          <Trash2 className="size-4" />
          Delete
        </MenuItem>
      </MenuPopup>
    </Menu>
  );
}
