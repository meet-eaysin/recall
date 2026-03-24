'use client';

import Link from 'next/link';
import * as React from 'react';
import { ArrowRight, Bot, Brain, FileText, Search } from 'lucide-react';
import type { DocumentPublicView, SemanticSearchResult } from '@repo/types';
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
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useSearchResults } from '../hooks';
import { PageContainer } from '@/features/workspace/components/page-container';

type ResultItem = DocumentPublicView | SemanticSearchResult;

function isSemanticResult(item: ResultItem): item is SemanticSearchResult {
  return 'documentId' in item;
}

function SearchResultRow({
  item,
  mode,
}: {
  item: ResultItem;
  mode: 'normal' | 'ai';
}) {
  const semantic = mode === 'ai' && isSemanticResult(item);
  const documentItem = semantic ? undefined : (item as DocumentPublicView);
  const href = semantic
    ? `/app/library/${item.documentId}`
    : `/app/library/${documentItem!.id}`;

  const preview = semantic
    ? item.preview
    : documentItem!.summary || documentItem!.content || 'No preview available.';

  return (
    <Link
      href={href}
      className="block rounded-lg border border-transparent p-4 transition hover:border-border hover:bg-accent/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium text-foreground">
              {item.title}
            </p>
            <Badge variant="outline" className="capitalize">
              {item.type}
            </Badge>
            <Badge variant="secondary" className="capitalize">
              {item.status.replace(/_/g, ' ')}
            </Badge>
          </div>
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            {preview}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {semantic ? (
            <span className="text-xs font-medium text-muted-foreground">
              {(item.score * 100).toFixed(0)}%
            </span>
          ) : null}
          <ArrowRight className="size-4 text-muted-foreground" />
        </div>
      </div>
    </Link>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="rounded-lg border p-4">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function SearchPage() {
  const [mode, setMode] = React.useState<'normal' | 'ai'>('ai');
  const [query, setQuery] = React.useState('');
  const [submittedQuery, setSubmittedQuery] = React.useState('');

  const filters = React.useMemo(
    () => ({
      q: submittedQuery,
      mode,
      limit: 12,
      page: 1,
    }),
    [mode, submittedQuery],
  );

  const { data, error, isFetching, isLoading } = useSearchResults(
    filters,
    submittedQuery.trim().length > 0,
  );

  return (
    <PageContainer className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground">
          Find exact matches or search by concept across your library.
        </p>
      </header>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle>Search your library</CardTitle>
                <CardDescription>
                  Use keyword search for exact matches or semantic search when
                  you only know the idea.
                </CardDescription>
              </div>
              <Tabs
                value={mode}
                onValueChange={(value) => setMode(value as 'normal' | 'ai')}
              >
                <TabsList>
                  <TabsTrigger value="normal">
                    <FileText className="size-4" />
                    Keyword
                  </TabsTrigger>
                  <TabsTrigger value="ai">
                    <Brain className="size-4" />
                    Semantic
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardPanel>
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmittedQuery(query.trim());
              }}
            >
              <Field>
                <FieldLabel>Search query</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>
                      <Search className="size-4" />
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={
                      mode === 'ai'
                        ? 'Search by concept or topic'
                        : 'Search by title, phrase, or document text'
                    }
                  />
                  <InputGroupAddon align="inline-end">
                    <Button type="submit" size="sm">
                      Search
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
                <FieldDescription>
                  {mode === 'ai'
                    ? 'Semantic mode ranks conceptually related documents.'
                    : 'Keyword mode works best for exact text and titles.'}
                </FieldDescription>
              </Field>
            </form>
          </CardPanel>
        </Card>

        {error ? (
          <Alert variant="error">
            <AlertTitle>Search failed</AlertTitle>
            <AlertDescription>{(error as Error).message}</AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <CardTitle>Results</CardTitle>
                <CardDescription>
                  {submittedQuery
                    ? `${data?.total ?? 0} matches for "${submittedQuery}".`
                    : 'Run a search to see matching documents.'}
                </CardDescription>
              </div>
              {isFetching ? (
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner className="size-4" />
                  Updating
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardPanel>
            {!submittedQuery ? (
              <Card className="border-dashed shadow-none">
                <Empty className="py-10">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Search className="size-4" />
                    </EmptyMedia>
                    <EmptyTitle>Search your library</EmptyTitle>
                    <EmptyDescription>
                      Use keyword search for exact matches or semantic search
                      for related ideas.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </Card>
            ) : null}

            {submittedQuery && isLoading ? <SearchSkeleton /> : null}

            {submittedQuery &&
            !isLoading &&
            !error &&
            (data?.items.length ?? 0) > 0 ? (
              <div className="divide-y rounded-lg border">
                {data?.items.map((item, index) => (
                  <div
                    key={
                      mode === 'ai'
                        ? (item as SemanticSearchResult).documentId
                        : (item as DocumentPublicView).id
                    }
                    className={cn(
                      index === 0 && 'rounded-t-lg',
                      'last:rounded-b-lg',
                    )}
                  >
                    <SearchResultRow item={item} mode={mode} />
                  </div>
                ))}
              </div>
            ) : null}

            {submittedQuery &&
            !isLoading &&
            !error &&
            (data?.items.length ?? 0) === 0 ? (
              <Card className="border-dashed shadow-none">
                <Empty className="py-10">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FileText className="size-4" />
                    </EmptyMedia>
                    <EmptyTitle>No matches found</EmptyTitle>
                    <EmptyDescription>
                      Try a broader query or continue in Ask AI for a grounded
                      response.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button
                      render={<Link href="/app/search/ask" />}
                      variant="outline"
                    >
                      <Bot className="size-4" />
                      Open Ask AI
                    </Button>
                  </EmptyContent>
                </Empty>
              </Card>
            ) : null}
          </CardPanel>
        </Card>
      </div>
    </PageContainer>
  );
}
