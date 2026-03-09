'use client';

import { useDocuments } from '@/lib/api/documents';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen } from 'lucide-react';

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { AddDocumentDialog } from './add-document-dialog';
import { DocumentCard } from './document-cards/document-card';

export function LibraryFeed() {
  const { data, isLoading, error } = useDocuments(1, 40);

  if (error) {
    return (
      <div className="py-12 text-center text-destructive">
        <p className="font-semibold">Failed to load library</p>
        <p className="text-sm">{(error as Error).message}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-2xl border bg-card p-4 gap-3"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="ml-auto h-4 w-14 rounded-sm" />
            </div>
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex gap-1.5">
                <Skeleton className="h-4 w-10 rounded-sm" />
                <Skeleton className="h-4 w-12 rounded-sm" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BookOpen />
          </EmptyMedia>
          <EmptyTitle>Your Library is empty</EmptyTitle>
          <EmptyDescription>
            Save articles, videos, and documents to build your personal
            knowledge base.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <AddDocumentDialog />
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-max">
      {items.map((doc) => (
        <DocumentCard key={doc.id} document={doc} />
      ))}
    </div>
  );
}
