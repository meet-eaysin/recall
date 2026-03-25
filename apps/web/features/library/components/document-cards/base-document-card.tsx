'use client';

import * as React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { DocumentRow } from '@/features/library/types';
import {
  getDocumentIcon,
  getStatusBadgeVariant,
  getStatusLabel,
  getTypeLabel,
} from '../../utils/document-helpers';
import { CardActions } from './card-actions';
import { DocumentPreviewSurface } from '../document-preview-surface';

interface BaseDocumentCardProps {
  document: DocumentRow;
  children: React.ReactNode;
}

export function BaseDocumentCard({
  document,
  children,
}: BaseDocumentCardProps) {
  const Icon = getDocumentIcon(document.type);
  const statusVariant = getStatusBadgeVariant(document.status);
  const statusLabel = getStatusLabel(document.status);
  const typeLabel = getTypeLabel(document.type);
  const hasTags = document.tags.length > 0;

  return (
    <Link
      href={`/app/library/${document.id}`}
      className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="flex h-full flex-col overflow-hidden border transition-colors duration-150 group-hover:border-border">
        <div className="border-b bg-muted/10 p-1.5">
          <div className="aspect-16/6 overflow-hidden rounded-lg bg-muted/20">
            <DocumentPreviewSurface compact document={document} />
          </div>
        </div>

        <CardContent className="flex flex-1 flex-col gap-2 p-2.5">
          <div className="flex items-start gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground">
              <Icon className="size-4" />
            </div>

            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-[11px] font-medium tracking-[0.12em] text-muted-foreground">
                  {typeLabel}
                </span>
                <Badge variant={statusVariant}>{statusLabel}</Badge>
              </div>
              <CardDescription className="text-xs">
                Updated{' '}
                {formatDistanceToNow(new Date(document.updatedAt), {
                  addSuffix: true,
                })}
              </CardDescription>
            </div>

            <div className="shrink-0">
              <CardActions document={document} />
            </div>
          </div>

          <div className="min-w-0 space-y-0.5">{children}</div>

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
              {document.tags.slice(0, 1).map((tag) => (
                <Badge variant="secondary" key={tag}>
                  {tag}
                </Badge>
              ))}
              {document.tags.length > 1 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                    >
                      +{document.tags.length - 1}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="max-w-64 p-3"
                    onClick={(event: React.MouseEvent) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {document.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {hasTags ? `${document.tags.length} tags` : statusLabel}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
