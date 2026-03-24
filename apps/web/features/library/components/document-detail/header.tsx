'use client';

import * as React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowUpRight,
  ChevronLeft,
  Clock,
  FileText,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { DocumentStatus } from '@repo/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { cn } from '@/lib/utils';
import {
  getStatusBadgeVariant,
  getStatusLabel,
  getTypeLabel,
} from '../../utils/document-helpers';
import { useDocumentDetail } from './context';
import { useRouter } from 'next/navigation';

const STATUS_OPTIONS = Object.values(DocumentStatus);

interface DocumentDetailHeaderProps {
  isCompact?: boolean;
}

export function DocumentDetailHeader({
  isCompact = false,
}: DocumentDetailHeaderProps) {
  const router = useRouter();
  const { document, actions } = useDocumentDetail();
  const [deleteDocumentOpen, setDeleteDocumentOpen] = React.useState(false);

  if (!document) return null;
  const currentDocument = document;

  async function handleDeleteDocument() {
    await actions.deleteDocument.mutateAsync(currentDocument.id);
    router.push('/app/library');
  }

  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 pb-3 mb-2',
        isCompact && 'items-center mb-3 pb-0',
      )}
    >
      <div className={cn('min-w-0 space-y-3', isCompact && 'space-y-1.5')}>
        {!isCompact && (
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Button
              variant="ghost"
              size="icon-sm"
              className="-ml-2 h-8 w-8"
              render={<Link href="/app/library" />}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-xs font-medium uppercase tracking-wider">
              Document Library
            </span>
          </div>
        )}
        <h1
          className={cn(
            'text-3xl font-bold tracking-tight text-foreground/90',
            isCompact && 'text-xl',
          )}
        >
          {document.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3">
          <Badge
            variant={getStatusBadgeVariant(document.status)}
            className="rounded-full px-3 py-1 text-xs font-semibold"
          >
            <div className="flex items-center gap-1.5">
              <div
                className={`size-1.5 rounded-full ${
                  document.status === DocumentStatus.ARCHIVED
                    ? 'bg-muted-foreground'
                    : 'bg-green-500'
                }`}
              />
              {getStatusLabel(document.status)}
            </div>
          </Badge>
          {document.type && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
              <FileText className="size-3.5 opacity-70" />
              {getTypeLabel(document.type)}
            </span>
          )}
          <Separator orientation="vertical" className="h-4 hidden sm:block" />
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5 opacity-70" />
            Updated{' '}
            {formatDistanceToNow(new Date(document.updatedAt), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>

      <div
        className={cn(
          'flex items-center gap-3 shrink-0 pt-10',
          isCompact && 'pt-0',
        )}
      >
        <Select
          onValueChange={(value) =>
            actions.updateDocument.mutate({ status: value as DocumentStatus })
          }
          value={document.status}
        >
          <SelectTrigger
            className={cn('h-9 w-40 text-sm font-medium', isCompact && 'w-32')}
          >
            <SelectValue>{getStatusLabel(document.status)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status} className="text-sm">
                {getStatusLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Menu>
          <MenuTrigger
            render={
              <Button size="icon" variant="outline" className="h-9 w-9">
                <MoreHorizontal className="size-4.5" />
              </Button>
            }
          />
          <MenuPopup align="end" className="w-48">
            {document.sourceUrl && (
              <MenuItem
                render={
                  <a
                    href={document.sourceUrl}
                    rel="noreferrer"
                    target="_blank"
                  />
                }
              >
                <ArrowUpRight className="size-4" />
                Open Original Source
              </MenuItem>
            )}
            <MenuSeparator />
            <MenuItem
              onClick={() => setDeleteDocumentOpen(true)}
              variant="destructive"
            >
              <Trash2 className="size-4" />
              Delete Document
            </MenuItem>
          </MenuPopup>
        </Menu>
      </div>

      <ConfirmationDialog
        open={deleteDocumentOpen}
        openChangeAction={setDeleteDocumentOpen}
        confirmAction={handleDeleteDocument}
        isPending={actions.deleteDocument.isPending}
        title="Delete document?"
        description={`This will permanently delete "${document.title}" and remove its notes, summary, and related data.`}
        confirmLabel="Delete document"
        tone="destructive"
      />
    </div>
  );
}
