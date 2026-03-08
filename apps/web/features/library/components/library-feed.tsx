'use client';

import * as React from 'react';
import { useDocuments } from '@/lib/api/documents';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FileText, Globe, Youtube, Atom } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { AddDocumentDialog } from './add-document-dialog';

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const items = data?.items || [];

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
      {items.map((doc) => {
        let Icon = FileText;
        if (doc.type === 'URL') Icon = Globe;
        if (doc.type === 'YOUTUBE') Icon = Youtube;
        if (doc.type === 'KNOWLEDGE') Icon = Atom;

        const isYoutube = doc.type.toUpperCase() === 'YOUTUBE';
        const isText = doc.type.toUpperCase() === 'TEXT';
        const isKnowledge = doc.type.toUpperCase() === 'KNOWLEDGE';

        return (
          <Link
            href={`/documents/${doc.id}`}
            key={doc.id}
            className="block group"
          >
            <Card
              className={cn(
                'h-full flex flex-col transition-all overflow-hidden bg-card/50 hover:bg-card relative',
                isYoutube
                  ? 'hover:border-red-500/50 hover:shadow-red-500/10'
                  : isText
                    ? 'hover:border-blue-500/50 hover:shadow-blue-500/10'
                    : isKnowledge
                      ? 'hover:border-purple-500/50 hover:shadow-purple-500/10'
                      : 'hover:border-primary/50 hover:shadow-primary/10',
              )}
            >
              {isYoutube && (
                <div className="h-32 w-full bg-muted/50 border-b flex items-center justify-center relative overflow-hidden">
                  <Youtube className="w-10 h-10 text-red-500/80 absolute z-10" />
                  <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors" />
                </div>
              )}
              {isText && (
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <FileText className="w-24 h-24" />
                </div>
              )}
              {isKnowledge && (
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Atom className="w-24 h-24" />
                </div>
              )}

              <CardHeader
                className={cn(
                  'p-4 flex flex-row items-center gap-3 space-y-0 pb-3',
                  isYoutube ? 'pt-4' : 'border-b border-subtle/40',
                )}
              >
                {!isYoutube && (
                  <div
                    className={cn(
                      'p-2 rounded-md transition-colors',
                      isText
                        ? 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20'
                        : isKnowledge
                          ? 'bg-purple-500/10 text-purple-500 group-hover:bg-purple-500/20'
                          : 'bg-muted text-foreground group-hover:text-primary',
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                )}
                <div className="flex-1 truncate text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {doc.type}
                </div>
              </CardHeader>

              <CardContent className="p-4 flex-1">
                <h3
                  className={cn(
                    'font-semibold leading-snug line-clamp-3 group-hover:underline underline-offset-4 decoration-primary/50',
                    isText ? 'text-lg' : 'text-base',
                  )}
                >
                  {doc.title}
                </h3>
                {doc.source && !isText && (
                  <p className="text-xs text-muted-foreground mt-2 truncate w-full">
                    {doc.source}
                  </p>
                )}
              </CardContent>

              <CardFooter className="p-4 pt-0 text-xs text-muted-foreground flex items-center justify-between">
                <div className="flex gap-2">
                  {doc.tags?.slice(0, 2).map((tag) => (
                    <Badge
                      variant="secondary"
                      key={tag}
                      className="px-1.5 py-0 text-[10px]"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {(doc.tags?.length || 0) > 2 && (
                    <Badge
                      variant="outline"
                      className="px-1.5 py-0 text-[10px]"
                    >
                      +{(doc.tags?.length || 0) - 2}
                    </Badge>
                  )}
                </div>

                <span className="shrink-0">
                  {formatDistanceToNow(new Date(doc.updatedAt), {
                    addSuffix: true,
                  })}
                </span>
              </CardFooter>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
