'use client';

import * as React from 'react';

import {
  Card,
  CardFrame,
  CardFrameAction,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import {
  useDocuments,
  useUpdateDocument,
  useDeleteDocument,
} from '@/features/library/hooks';
import {
  getDocumentIcon,
  getStatusBadgeVariant,
  getStatusLabel,
} from '@/features/library/utils/document-helpers';
import {
  useDailyReview,
  useDismissReview,
  useReviewRecommendations,
} from '../hooks';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  BookOpenCheck,
  BookOpen,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  Circle,
  Clock,
  Clock3,
  History,
  Plus,
  Search,
  Sparkles,
  Youtube,
  Archive,
} from 'lucide-react';
import { type ReviewItem, DocumentStatus } from '@repo/types';
import type { DocumentRow } from '@/features/library/types';
import { format } from 'date-fns';

const STATUS_ICON_MAP: Record<DocumentStatus, React.ElementType> = {
  [DocumentStatus.TO_READ]: BookOpen,
  [DocumentStatus.TO_WATCH]: Youtube,
  [DocumentStatus.IN_PROCESS]: Clock,
  [DocumentStatus.REVIEW]: Sparkles,
  [DocumentStatus.UPCOMING]: CalendarDays,
  [DocumentStatus.COMPLETED]: Check,
  [DocumentStatus.PENDING_COMPLETION]: History,
  [DocumentStatus.ARCHIVED]: Archive,
};

function formatPriority(score: number) {
  return `${Math.round(score * 100)}%`;
}

function ReviewRow({
  item,
  onDismiss,
  isPending,
}: {
  item: ReviewItem;
  onDismiss: (documentId: string) => void;
  isPending: boolean;
}) {
  const Icon = getDocumentIcon(item.type);

  return (
    <Card className="group relative flex items-start justify-between gap-4 p-4 transition-all hover:bg-accent/50">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-sm border bg-muted/40 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
            <Icon className="size-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href={`/app/library/${item.documentId}`}
              className="truncate text-sm font-semibold tracking-tight text-foreground hover:underline"
            >
              {item.title}
            </Link>
            <div className="mt-0.5 flex items-center gap-2">
              <Badge
                variant={getStatusBadgeVariant(item.status)}
                size="sm"
                className="font-bold uppercase tracking-wider"
              >
                {getStatusLabel(item.status)}
              </Badge>
              <Badge variant="outline" size="sm" className="opacity-70">
                {formatPriority(item.priorityScore)} intent
              </Badge>
            </div>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground/80 line-clamp-1">
          {item.reason}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="xs"
          variant="secondary"
          className="font-bold opacity-0 group-hover:opacity-100 transition-opacity"
          render={<Link href={`/app/library/${item.documentId}`} />}
        >
          Review
        </Button>
        <Button
          size="icon-xs"
          variant="ghost"
          className="text-muted-foreground/60 hover:text-destructive transition-all"
          disabled={isPending}
          onClick={() => onDismiss(item.documentId)}
        >
          {isPending ? (
            <Spinner className="size-3" />
          ) : (
            <CheckCheck className="size-4" />
          )}
        </Button>
      </div>
    </Card>
  );
}

function RecentWorkRow({ document }: { document: DocumentRow }) {
  const Icon = getDocumentIcon(document.type);
  const updateMutation = useUpdateDocument(document.id);
  const deleteMutation = useDeleteDocument();

  const isUpdating = updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  return (
    <Card className="group flex flex-row items-center justify-between gap-4 p-4 hover:bg-accent/40 transition-colors">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex size-9 items-center justify-center rounded-md border bg-muted/30 text-muted-foreground group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex flex-col gap-0.5">
          <Link
            href={`/app/library/${document.id}`}
            className="truncate text-sm font-bold tracking-tight text-foreground/90 hover:text-blue-500 transition-colors"
          >
            {document.title}
          </Link>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 rounded py-0.5 px-1 -ml-1 hover:bg-muted/50 transition-colors group/trigger">
                <div
                  className={cn(
                    'size-1.5 rounded-full shrink-0',
                    document.status === DocumentStatus.COMPLETED
                      ? 'bg-green-500'
                      : document.status === DocumentStatus.IN_PROCESS
                        ? 'bg-amber-500'
                        : 'bg-blue-500',
                  )}
                />
                <span className="text-xs font-bold text-muted-foreground/64 group-hover/trigger:text-muted-foreground transition-colors">
                  {getStatusLabel(document.status)}
                </span>
                <ChevronDown className="size-3 text-muted-foreground/32 group-hover/trigger:text-muted-foreground transition-colors" />
                {isUpdating && <Spinner className="size-3 ml-1" />}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {Object.values(DocumentStatus).map((status) => {
                  const ItemIcon = STATUS_ICON_MAP[status] || Circle;
                  return (
                    <DropdownMenuItem
                      key={status}
                      onClick={(e) => {
                        e.stopPropagation();
                        void updateMutation.mutateAsync({ status });
                      }}
                      className="flex items-center gap-3 text-xs"
                    >
                      <ItemIcon className="size-3.5 opacity-64" />
                      {getStatusLabel(status)}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-xs font-medium text-muted-foreground/32 flex items-center gap-1">
              <Clock3 className="size-3" />
              {format(new Date(document.updatedAt || Date.now()), 'MMM d')}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="secondary"
          className="font-bold"
          render={<Link href={`/app/library/${document.id}`} />}
        >
          View
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="font-bold text-muted-foreground/50 hover:text-destructive transition-colors"
          disabled={isDeleting}
          onClick={(e) => {
            e.stopPropagation();
            void deleteMutation.mutateAsync(document.id);
          }}
        >
          {isDeleting ? <Spinner className="size-4" /> : 'Dismiss'}
        </Button>
      </div>
    </Card>
  );
}

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col">
      {Array.from({ length: rows }).map((_, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-sm" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function HomeContent() {
  const { data: reviewItems, isLoading: reviewLoading } = useDailyReview();
  const { data: recommendations, isLoading: recommendationLoading } =
    useReviewRecommendations();
  const { data: documentsData, isLoading: docsLoading } = useDocuments({
    limit: 6,
    page: 1,
  });
  const dismissReview = useDismissReview();

  const documents = documentsData?.items ?? [];

  return (
    <div className="space-y-8">
      <CardFrame>
        <CardFrameHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-sm bg-primary/10 text-primary border">
              <BookOpenCheck className="size-4" />
            </div>
            <CardFrameTitle className="text-sm font-bold">
              Review queue
            </CardFrameTitle>
          </div>
          <CardFrameDescription className="text-xs">
            High-priority knowledge synthesis required for today.
          </CardFrameDescription>
          <CardFrameAction>
            <Badge variant="secondary" size="sm" className="font-bold">
              {reviewItems?.length ?? 0}
            </Badge>
          </CardFrameAction>
        </CardFrameHeader>
        <CardPanel className="p-0">
          {reviewLoading ? <SectionSkeleton rows={2} /> : null}

          {!reviewLoading && (reviewItems?.length ?? 0) === 0 ? (
            <Card className="p-8">
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyMedia
                    variant="icon"
                    className="bg-primary/5 text-primary/30"
                  >
                    <CheckCheck className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle>Fully Synchronized</EmptyTitle>
                </EmptyHeader>
              </Empty>
            </Card>
          ) : null}

          <div className="flex flex-col">
            {reviewItems?.slice(0, 4).map((item) => (
              <ReviewRow
                key={item.documentId}
                item={item}
                isPending={
                  dismissReview.isPending &&
                  dismissReview.variables === item.documentId
                }
                onDismiss={(documentId) =>
                  void dismissReview.mutateAsync(documentId)
                }
              />
            ))}
          </div>
        </CardPanel>
      </CardFrame>

      <CardFrame>
        <CardFrameHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-sm bg-blue-500/10 text-blue-500 border">
              <Clock3 className="size-4" />
            </div>
            <CardFrameTitle className="text-sm font-bold">
              Recent work
            </CardFrameTitle>
          </div>
          <CardFrameDescription className="text-xs">
            Continuity for your latest research and annotations.
          </CardFrameDescription>
          <CardFrameAction>
            <Button
              variant="ghost"
              size="xs"
              render={<Link href="/app/library" />}
            >
              Library
              <ArrowRight className="ml-1 size-3" />
            </Button>
          </CardFrameAction>
        </CardFrameHeader>
        <CardPanel className="p-0">
          {docsLoading ? <SectionSkeleton rows={2} /> : null}

          {!docsLoading && documents.length === 0 ? (
            <Card className="p-8">
              <Empty className="py-6">
                <EmptyHeader>
                  <EmptyMedia
                    variant="icon"
                    className="bg-blue-500/5 text-blue-500/30"
                  >
                    <CalendarDays className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle>No history yet</EmptyTitle>
                </EmptyHeader>
              </Empty>
            </Card>
          ) : null}

          <div className="flex flex-col">
            {documents.slice(0, 4).map((document) => (
              <RecentWorkRow key={document.id} document={document} />
            ))}
          </div>
        </CardPanel>
      </CardFrame>

      <CardFrame>
        <CardFrameHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-sm bg-orange-500/10 text-orange-500 border">
              <Sparkles className="size-4" />
            </div>
            <CardFrameTitle className="text-sm font-bold">
              Recommended
            </CardFrameTitle>
          </div>
          <CardFrameDescription className="text-xs">
            AI-driven serendipity based on your current knowledge graph.
          </CardFrameDescription>
          <CardFrameAction>
            <Button
              variant="ghost"
              size="icon-xs"
              render={<Link href="/app/search" />}
            >
              <Search className="size-3.5" />
            </Button>
          </CardFrameAction>
        </CardFrameHeader>
        <CardPanel className="p-0">
          {recommendationLoading ? <SectionSkeleton rows={2} /> : null}

          {!recommendationLoading &&
          (recommendations?.ownedDocuments.length ?? 0) === 0 ? (
            <Card className="p-8">
              <Empty className="py-6">
                <EmptyContent>
                  <EmptyMedia
                    variant="icon"
                    className="bg-orange-500/5 text-orange-500/30"
                  >
                    <Plus className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle>Building Context</EmptyTitle>
                </EmptyContent>
              </Empty>
            </Card>
          ) : null}

          <div className="flex flex-col">
            {recommendations?.ownedDocuments.slice(0, 4).map((document) => {
              const Icon = getDocumentIcon(document.type);
              return (
                <Card
                  key={document.id}
                  render={<Link href={`/app/library/${document.id}`} />}
                  className="group flex flex-row items-center justify-between gap-4 p-4 hover:bg-accent/50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-sm border bg-muted/40 text-muted-foreground group-hover:text-orange-500 transition-all">
                      <Icon className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold tracking-tight text-foreground">
                        {document.title}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                        {document.tags[0] || 'Discovery'}
                      </p>
                    </div>
                  </div>
                  <Sparkles className="size-3.5 shrink-0 text-orange-500 opacity-0 transition-all group-hover:opacity-100" />
                </Card>
              );
            })}
          </div>
        </CardPanel>
      </CardFrame>
    </div>
  );
}

export function HomePage() {
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? 'Good morning'
      : currentHour < 18
        ? 'Good afternoon'
        : 'Good evening';

  return (
    <div className="container max-w-4xl space-y-10 py-12">
      <header className="flex flex-col items-start justify-between gap-6 px-1 lg:flex-row lg:items-end">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-primary rounded-full" />
            <h1
              className="text-3xl font-black tracking-tighter sm:text-4xl"
              suppressHydrationWarning
            >
              {greeting}.
            </h1>
          </div>
          <p className="max-w-xl text-base font-medium text-muted-foreground/60 leading-relaxed">
            Ready to pick up where you left off? Review your high-intent items
            and continue your research threads.
          </p>
        </div>
        <Button
          variant="default"
          size="default"
          render={<Link href="/app/library/new" />}
        >
          <Plus className="mr-2 size-4" />
          Add Document
        </Button>
      </header>

      <main>
        <HomeContent />
      </main>

      <footer className="pt-12 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">
          Integrated Intelligence Catalyst
        </p>
      </footer>
    </div>
  );
}
