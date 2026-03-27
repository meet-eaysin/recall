'use client';

import * as React from 'react';
import { DocumentStatus, DocumentType } from '@repo/types';
import { BookOpen, Files, Filter, FolderPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { DocumentCard } from './document-cards/document-card';
import { FolderCreateDialog } from './folder-create-dialog';
import { useDocuments, useFolders } from '../hooks';
import { getStatusLabel, getTypeLabel } from '../utils/document-helpers';
import { FolderShelfCard } from './folder-shelf-card';

const ALL = 'all';

export function LibraryFeed() {
  const [activeFolderId, setActiveFolderId] = React.useState<string | null>(
    null,
  );
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState<DocumentStatus | null>(null);
  const [type, setType] = React.useState<DocumentType | null>(null);

  const filters = React.useMemo(
    () => ({
      folderIds: activeFolderId ? [activeFolderId] : undefined,
      unassigned: !activeFolderId && !status && !type ? true : undefined,
      limit: 24,
      page,
      status: status ?? undefined,
      type: type ?? undefined,
    }),
    [activeFolderId, page, status, type],
  );

  const { data, error, isLoading } = useDocuments(filters);
  const { data: folders = [] } = useFolders();
  const items = data?.items ?? [];
  const totalPages = Math.max(
    1,
    Math.ceil((data?.total ?? 0) / (data?.limit ?? filters.limit ?? 24)),
  );

  React.useEffect(() => {
    setPage(1);
  }, [activeFolderId, status, type]);

  function clearFilters() {
    setActiveFolderId(null);
    setPage(1);
    setStatus(null);
    setType(null);
  }

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
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col overflow-hidden rounded-xl border bg-card"
            >
              <div className="border-b bg-muted/10 p-1.5">
                <Skeleton className="aspect-16/6 w-full rounded-lg" />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-2.5">
                <div className="flex items-start gap-2">
                  <Skeleton className="size-8 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="mt-1 space-y-1.5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="mt-auto flex items-center justify-between pt-1">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="size-2 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {activeFolderId && (
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 h-8"
                onClick={() => setActiveFolderId(null)}
              >
                <Files className="mr-2 size-4" />
                Library
              </Button>
            )}
            <h2 className="text-sm font-semibold tracking-tight">
              {activeFolderId
                ? `/ ${folders.find((f) => f.id === activeFolderId)?.name ?? 'Folder'}`
                : 'Documents'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {!activeFolderId && (
              <FolderCreateDialog
                trigger={
                  <Button variant="outline" size="sm">
                    <FolderPlus className="mr-2 size-4" />
                    New Folder
                  </Button>
                }
              />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 size-4" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    Type: {type ? getTypeLabel(type) : 'All Types'}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-48">
                    <DropdownMenuRadioGroup
                      onValueChange={(value) =>
                        setType(value === ALL ? null : (value as DocumentType))
                      }
                      value={type ?? ALL}
                    >
                      <DropdownMenuRadioItem value={ALL}>
                        All Types
                      </DropdownMenuRadioItem>
                      {Object.values(DocumentType).map((item) => (
                        <DropdownMenuRadioItem key={item} value={item}>
                          {getTypeLabel(item)}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    Status: {status ? getStatusLabel(status) : 'All Statuses'}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-52">
                    <DropdownMenuRadioGroup
                      onValueChange={(value) =>
                        setStatus(
                          value === ALL ? null : (value as DocumentStatus),
                        )
                      }
                      value={status ?? ALL}
                    >
                      <DropdownMenuRadioItem value={ALL}>
                        All Statuses
                      </DropdownMenuRadioItem>
                      {Object.values(DocumentStatus).map((item) => (
                        <DropdownMenuRadioItem key={item} value={item}>
                          {getStatusLabel(item)}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={clearFilters}>
                  <X className="mr-2 size-4" />
                  Clear Filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {items.length === 0 &&
        (!activeFolderId ? folders.length === 0 : true) ? (
          <Card className="border-dashed">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BookOpen />
                </EmptyMedia>
                <EmptyTitle>No items found</EmptyTitle>
                <EmptyDescription>
                  Adjust the current filters or add a new folder or document.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={clearFilters} variant="outline">
                  Clear filters
                </Button>
              </EmptyContent>
            </Empty>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-3 auto-rows-max sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {/* INTERLEAVED GRID: Folders First (only at root without filters) */}
              {!activeFolderId &&
                !status &&
                !type &&
                folders.map((folder) => (
                  <FolderShelfCard
                    key={folder.id}
                    active={false}
                    folder={folder}
                    onClick={() => {
                      setActiveFolderId(folder.id);
                      setPage(1);
                    }}
                  />
                ))}

              {/* Documents */}
              {items.map((doc) => (
                <DocumentCard key={doc.id} document={doc} />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      aria-disabled={page <= 1}
                      className={
                        page <= 1 ? 'pointer-events-none opacity-50' : ''
                      }
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        if (page > 1) setPage(page - 1);
                      }}
                    />
                  </PaginationItem>

                  {getVisiblePages(page, totalPages).map((item, index) => (
                    <PaginationItem key={`${item}-${index}`}>
                      {item === 'ellipsis' ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          href="#"
                          isActive={item === page}
                          onClick={(event) => {
                            event.preventDefault();
                            setPage(item);
                          }}
                        >
                          {item}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      aria-disabled={page >= totalPages}
                      className={
                        page >= totalPages
                          ? 'pointer-events-none opacity-50'
                          : ''
                      }
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        if (page < totalPages) setPage(page + 1);
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 'ellipsis', totalPages] as const;
  }

  if (currentPage >= totalPages - 2) {
    return [
      1,
      'ellipsis',
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ] as const;
  }

  return [
    1,
    'ellipsis',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    'ellipsis',
    totalPages,
  ] as const;
}
