'use client';

import {
  ArrowRight,
  BookOpenCheck,
  Bot,
  CalendarDays,
  CheckCheck,
  Clock3,
  MoveRight,
  Plus,
  Search,
  Sparkles,
  Tag,
} from 'lucide-react';
import type { ReviewItem } from '@repo/types';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { useDocuments } from '@/features/library/hooks';
import {
  getDocumentIcon,
  getStatusBadgeVariant,
  getStatusLabel,
} from '@/features/library/utils/document-helpers';
import { useSearchChats } from '@/features/search/hooks';
import {
  useDailyReview,
  useDismissReview,
  useReviewRecommendations,
} from '../hooks';

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
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-3">
      <div className="min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-border/60 bg-muted/30 p-1.5">
            <Icon className="size-4 text-muted-foreground" />
          </div>
          <Link
            href={`/app/library/${item.documentId}`}
            className="truncate text-sm font-medium text-foreground hover:underline"
          >
            {item.title}
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={getStatusBadgeVariant(item.status)}>
            {getStatusLabel(item.status)}
          </Badge>
          <Badge variant="outline">{formatPriority(item.priorityScore)}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{item.reason}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          size="sm"
          variant="outline"
          render={<Link href={`/app/library/${item.documentId}`} />}
        >
          Review
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={() => onDismiss(item.documentId)}
        >
          {isPending ? <Spinner className="size-4" /> : 'Dismiss'}
        </Button>
      </div>
    </div>
  );
}

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="rounded-lg border border-border/60 p-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="mt-3 h-4 w-2/3" />
          <Skeleton className="mt-2 h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function HomeContent() {
  const { data: reviewItems, error: reviewError, isLoading: reviewLoading } =
    useDailyReview();
  const {
    data: recommendations,
    error: recommendationError,
    isLoading: recommendationLoading,
  } = useReviewRecommendations();
  const { data: documentsData, isLoading: docsLoading } = useDocuments({
    limit: 6,
    page: 1,
  });
  const { data: chats, isLoading: chatsLoading } = useSearchChats();
  const dismissReview = useDismissReview();

  const documents = documentsData?.items ?? [];
  const recentChats = (chats ?? []).slice(0, 4);

  return (
    <div className="mt-4 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Clock3 className="size-3.5" />
                Today
              </div>
              <CardTitle>Your daily flow</CardTitle>
              <CardDescription>
                Review what is due, pick up a recommended document, or jump back into
                an active conversation.
              </CardDescription>
            </div>
            <Button variant="outline" render={<Link href="/app/search" />}>
              <Search className="size-4" />
              Ask AI
            </Button>
          </div>
        </CardHeader>
        <CardPanel className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-border/60 p-4">
            <p className="text-xs text-muted-foreground">Due for review</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {reviewItems?.length ?? 0}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Start here if you want the system to guide the next step.
            </p>
          </div>
          <div className="rounded-lg border border-border/60 p-4">
            <p className="text-xs text-muted-foreground">Recommended next</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {recommendations?.ownedDocuments.length ?? 0}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Unread items connected to your current topics.
            </p>
          </div>
          <div className="rounded-lg border border-border/60 p-4">
            <p className="text-xs text-muted-foreground">Recent conversations</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {recentChats.length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              AI chats you can reopen without searching again.
            </p>
          </div>
        </CardPanel>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <BookOpenCheck className="size-3.5" />
                    Daily review
                  </div>
                  <CardTitle>Review queue</CardTitle>
                  <CardDescription>
                    The best place to start when you want a useful, focused task.
                  </CardDescription>
                </div>
                <Badge variant="secondary">{reviewItems?.length ?? 0} due</Badge>
              </div>
            </CardHeader>
            <CardPanel className="space-y-3">
              {reviewError ? (
                <Alert variant="error">
                  <AlertTitle>Review unavailable</AlertTitle>
                  <AlertDescription>
                    {(reviewError as Error).message}
                  </AlertDescription>
                </Alert>
              ) : null}

              {reviewLoading ? <SectionSkeleton rows={4} /> : null}

              {!reviewLoading && (reviewItems?.length ?? 0) === 0 ? (
                <Empty className="min-h-0 px-0 py-8">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <CheckCheck className="size-4" />
                    </EmptyMedia>
                    <EmptyTitle>Nothing due right now</EmptyTitle>
                    <EmptyDescription>
                      Your review queue is clear. Continue a document or pick
                      something from the recommendations.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : null}

              {reviewItems?.map((item) => (
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
            </CardPanel>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    Continue where you left off
                  </div>
                  <CardTitle>Recent documents</CardTitle>
                  <CardDescription>
                    Resume the documents you already touched recently.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href="/app/library" />}
                >
                  Library
                </Button>
              </div>
            </CardHeader>
            <CardPanel className="space-y-2">
              {docsLoading ? <SectionSkeleton /> : null}
              {!docsLoading && documents.length === 0 ? (
                <Empty className="min-h-0 px-0 py-8">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <CalendarDays className="size-4" />
                    </EmptyMedia>
                    <EmptyTitle>No documents yet</EmptyTitle>
                    <EmptyDescription>
                      Start by adding a document to build your review flow.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : null}

              {documents.map((document) => {
                const Icon = getDocumentIcon(document.type);

                return (
                  <Link
                    key={document.id}
                    href={`/app/library/${document.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3 transition hover:bg-accent/20"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="rounded-md border border-border/60 bg-muted/30 p-1.5">
                        <Icon className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {document.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getStatusLabel(document.status)}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                );
              })}
            </CardPanel>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Tag className="size-3.5" />
                    Suggested next
                  </div>
                  <CardTitle>Recommendations</CardTitle>
                  <CardDescription>
                    Good next reads based on the topics already forming in your
                    library.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  render={<Link href="/app/search" />}
                >
                  <Search className="size-4" />
                  Explore
                </Button>
              </div>
            </CardHeader>
            <CardPanel className="space-y-4">
              {recommendationError ? (
                <Alert variant="error">
                  <AlertTitle>Recommendations unavailable</AlertTitle>
                  <AlertDescription>
                    {(recommendationError as Error).message}
                  </AlertDescription>
                </Alert>
              ) : null}

              {recommendationLoading ? <SectionSkeleton rows={2} /> : null}

              {!recommendationLoading &&
              (recommendations?.ownedDocuments.length ?? 0) === 0 &&
              (recommendations?.suggestedTopics.length ?? 0) === 0 ? (
                <Empty className="min-h-0 px-0 py-8">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Sparkles className="size-4" />
                    </EmptyMedia>
                    <EmptyTitle>No recommendations yet</EmptyTitle>
                    <EmptyDescription>
                      Add a few more documents and tags to unlock better
                      next-step suggestions.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : null}

              {(recommendations?.suggestedTopics.length ?? 0) > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {recommendations?.suggestedTopics.slice(0, 8).map((topic) => (
                    <Badge key={topic} variant="secondary">
                      {topic}
                    </Badge>
                  ))}
                </div>
              ) : null}

              <div className="space-y-2">
                {recommendations?.ownedDocuments.map((document) => {
                  const Icon = getDocumentIcon(document.type);

                  return (
                    <Link
                      key={document.id}
                      href={`/app/library/${document.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3 transition hover:bg-accent/20"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="rounded-md border border-border/60 bg-muted/30 p-1.5">
                          <Icon className="size-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {document.title}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {document.tags.slice(0, 3).join(' • ') ||
                              'Recommended next'}
                          </p>
                        </div>
                      </div>
                      <MoveRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  );
                })}
              </div>
            </CardPanel>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Search className="size-3.5" />
                    Continue conversations
                  </div>
                  <CardTitle>Recent conversations</CardTitle>
                  <CardDescription>
                    Reopen the AI conversations you are actively building on.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  render={<Link href="/app/search" />}
                >
                  <Bot className="size-4" />
                  Open search
                </Button>
              </div>
            </CardHeader>
            <CardPanel className="space-y-2">
              {chatsLoading ? <SectionSkeleton rows={3} /> : null}
              {!chatsLoading && recentChats.length === 0 ? (
                <Empty className="min-h-0 px-0 py-8">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Bot className="size-4" />
                    </EmptyMedia>
                    <EmptyTitle>No conversations yet</EmptyTitle>
                    <EmptyDescription>
                      Ask a question and your recent conversations will appear
                      here.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : null}

              {recentChats.map((chat) => (
                <Link
                  key={chat.id}
                  href={`/app/search?chat=${chat.id}`}
                  className="block rounded-lg border border-border/60 p-3 transition hover:bg-accent/20"
                >
                  <p className="line-clamp-1 text-sm font-medium text-foreground">
                    {chat.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {chat.lastMessagePreview || 'Continue this conversation.'}
                  </p>
                </Link>
              ))}
            </CardPanel>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Home</h1>
          <p className="text-muted-foreground">Start with what needs attention today, then continue the work already in motion.</p>
        </div>
        <Button render={<Link href="/app/library/new" />}>
          <Plus className="size-4" />
          Add document
        </Button>
      </header>
      <HomeContent />
    </div>
  );
}
