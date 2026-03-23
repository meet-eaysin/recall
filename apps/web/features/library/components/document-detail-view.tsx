'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  DocumentDetailProvider,
  useDocumentDetail,
} from './document-detail/context';
import { DocumentDetailHeader } from './document-detail/header';
import { DocumentDetailReader } from './document-detail/reader';
import { DocumentDetailTabs } from './document-detail/tabs';
import { DocumentDetailSkeleton } from './document-detail/skeleton';

export function DocumentDetailView({
  id,
  isCompact = false,
}: {
  id: string;
  isCompact?: boolean;
}) {
  return (
    <DocumentDetailProvider id={id}>
      <DocumentDetailContent isCompact={isCompact} />
    </DocumentDetailProvider>
  );
}

function DocumentDetailContent({ isCompact }: { isCompact: boolean }) {
  const { document, error, isLoading } = useDocumentDetail();

  if (isLoading) {
    return <DocumentDetailSkeleton />;
  }

  if (error || !document) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md w-full border-dashed">
          <CardContent className="p-10">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Document not available</EmptyTitle>
                <EmptyDescription>
                  {(error as Error | undefined)?.message ??
                    'The document could not be loaded.'}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                >
                  <Link href="/app/library">
                    <ChevronLeft className="size-4" />
                    Back to Library
                  </Link>
                </Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('space-y-5', isCompact && 'px-6 py-4')}>
      <DocumentDetailHeader isCompact={isCompact} />
      <section className={cn('space-y-8', isCompact && 'space-y-6')}>
        <DocumentDetailReader />
        <DocumentDetailTabs isCompact={isCompact} />
      </section>
    </div>
  );
}
