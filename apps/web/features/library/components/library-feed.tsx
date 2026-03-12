'use client';

import * as React from 'react';
import { DocumentStatus, DocumentType } from '@repo/types';
import { BookOpen, Files, Filter, Folder, FolderPlus, X } from 'lucide-react';
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
  Menu,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
  MenuTrigger,
} from '@/components/ui/menu';
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
      limit: 24,
      page,
      status: status ?? undefined,
      type: type ?? undefined,
    }),
    [activeFolderId, page, status, type],
  );

  const { data, error, isLoading } = useDocuments(filters);
  const { data: folders = [], isLoading: foldersLoading } = useFolders();
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

        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton className="h-8 w-24" key={index} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-2xl border bg-card p-4"
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold tracking-tight">Folders</h2>
            <p className="text-sm text-muted-foreground">
              Pick a folder to narrow the library, or stay on all documents.
            </p>
          </div>
          <FolderCreateDialog
            trigger={
              <Button variant="outline">
                <FolderPlus className="size-4" />
                New Folder
              </Button>
            }
          />
        </div>

        {foldersLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton className="h-24 rounded-xl" key={index} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FolderShelfCard
              active={!activeFolderId}
              description="Browse everything in your library."
              icon={Files}
              name="All Documents"
              onClick={() => {
                setActiveFolderId(null);
                setPage(1);
              }}
            />
            {folders.map((folder) => (
              <FolderShelfCard
                key={folder.id}
                active={activeFolderId === folder.id}
                description={
                  folder.description?.trim() ||
                  'Open this folder to view its documents.'
                }
                folder={folder}
                icon={Folder}
                name={folder.name}
                onClick={() => {
                  setActiveFolderId(folder.id);
                  setPage(1);
                }}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold tracking-tight">
              {activeFolderId
                ? `${folders.find((folder) => folder.id === activeFolderId)?.name ?? 'Folder'} documents`
                : 'All documents'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {activeFolderId
                ? 'Documents inside the selected folder.'
                : 'Every document in your library.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Menu>
              <MenuTrigger
                render={
                  <Button variant="outline">
                    <Filter className="size-4" />
                    Filters
                  </Button>
                }
              />
              <MenuPopup align="start" className="w-56">
                <MenuSub>
                  <MenuSubTrigger>
                    Type: {type ? getTypeLabel(type) : 'All Types'}
                  </MenuSubTrigger>
                  <MenuSubPopup className="w-48">
                    <MenuRadioGroup
                      onValueChange={(value) =>
                        setType(value === ALL ? null : (value as DocumentType))
                      }
                      value={type ?? ALL}
                    >
                      <MenuRadioItem value={ALL}>All Types</MenuRadioItem>
                      {Object.values(DocumentType).map((item) => (
                        <MenuRadioItem key={item} value={item}>
                          {getTypeLabel(item)}
                        </MenuRadioItem>
                      ))}
                    </MenuRadioGroup>
                  </MenuSubPopup>
                </MenuSub>
                <MenuSub>
                  <MenuSubTrigger>
                    Status: {status ? getStatusLabel(status) : 'All Statuses'}
                  </MenuSubTrigger>
                  <MenuSubPopup className="w-52">
                    <MenuRadioGroup
                      onValueChange={(value) =>
                        setStatus(
                          value === ALL ? null : (value as DocumentStatus),
                        )
                      }
                      value={status ?? ALL}
                    >
                      <MenuRadioItem value={ALL}>All Statuses</MenuRadioItem>
                      {Object.values(DocumentStatus).map((item) => (
                        <MenuRadioItem key={item} value={item}>
                          {getStatusLabel(item)}
                        </MenuRadioItem>
                      ))}
                    </MenuRadioGroup>
                  </MenuSubPopup>
                </MenuSub>
                <MenuSeparator />
                <MenuItem onClick={clearFilters}>
                  <X className="size-4" />
                  Clear Filters
                </MenuItem>
              </MenuPopup>
            </Menu>
          </div>
        </div>
        {items.length === 0 ? (
          <Card className="border-dashed">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BookOpen />
                </EmptyMedia>
                <EmptyTitle>No documents found</EmptyTitle>
                <EmptyDescription>
                  Adjust the current filters or add a new document.
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
            <div className="grid grid-cols-1 gap-4 auto-rows-max sm:grid-cols-2 lg:grid-cols-3">
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
