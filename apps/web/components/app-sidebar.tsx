'use client';

import * as React from 'react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { isToday, subDays, isAfter } from 'date-fns';

import {
  useArchiveChat,
  useDeleteChat,
  useSearchChats,
} from '@/features/search/hooks';
import { useDocuments } from '@/features/library/hooks';
import { NavUser } from '@/components/nav-user';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarInput,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  SearchIcon,
  MessageSquareIcon,
  ArchiveIcon,
  Trash2Icon,
  PlusIcon,
  MoreHorizontal,
} from 'lucide-react';
import { ApplicationIcon } from './application-logo';
import { cn } from '@/lib/utils';

function SidebarSearch({
  value,
  onChange,
  focusKey,
  onRequestFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  focusKey: number;
  onRequestFocus: () => void;
}) {
  const { state, setOpen } = useSidebar();

  if (state === 'collapsed') {
    return (
      <SidebarGroup className="py-0 mb-1">
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Search"
              className="group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
              onClick={() => {
                onRequestFocus();
                setOpen(true);
              }}
            >
              <SearchIcon className="size-4.5" />
              <span className="sr-only">Search</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup className="py-0 mb-2">
      <div className="relative mt-1">
        <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
        <SidebarInput
          key={`search-input-${focusKey}`}
          placeholder="Search chats..."
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoFocus={focusKey > 0}
          className="pl-9 bg-sidebar-accent/50 border-none focus-visible:ring-1 focus-visible:ring-sidebar-ring transition-all"
        />
      </div>
    </SidebarGroup>
  );
}

function SidebarChatList({ query }: { query: string }) {
  const { data: chats, isLoading } = useSearchChats();
  const pathname = usePathname();
  const archiveChat = useArchiveChat();
  const deleteChat = useDeleteChat();
  const router = useRouter();
  const { data: documentsData, isLoading: docsLoading } = useDocuments({
    limit: 1,
    page: 1,
  });
  const isEmptyLibrary = !docsLoading && documentsData?.total === 0;

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [chatToDelete, setChatToDelete] = React.useState<
    NonNullable<typeof chats>[number] | null
  >(null);

  const filteredChats = React.useMemo(() => {
    if (!chats) return [];
    const trimmed = query.trim();
    if (!trimmed) return chats;
    const lower = trimmed.toLowerCase();
    return chats.filter(
      (chat) =>
        chat.title.toLowerCase().includes(lower) ||
        chat.lastMessagePreview?.toLowerCase().includes(lower),
    );
  }, [chats, query]);

  const groupedChats = React.useMemo(() => {
    const today: typeof chats = [];
    const previous7Days: typeof chats = [];
    const older: typeof chats = [];

    if (!filteredChats.length) return { today, previous7Days, older };

    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);

    filteredChats.forEach((chat) => {
      const chatDate = new Date(chat.createdAt);
      if (isToday(chatDate)) {
        today.push(chat);
      } else if (isAfter(chatDate, sevenDaysAgo)) {
        previous7Days.push(chat);
      } else {
        older.push(chat);
      }
    });

    return { today, previous7Days, older };
  }, [filteredChats]);

  const renderChatItem = (chat: NonNullable<typeof chats>[number]) => (
    <SidebarMenuItem key={chat.id}>
      <SidebarMenuButton
        asChild
        isActive={pathname.includes(chat.id)}
        tooltip={chat.title}
        className="h-auto py-2.5 items-start transition-all duration-200 hover:bg-sidebar-accent/50 data-active:bg-sidebar-accent data-active:shadow-sm"
      >
        <Link href={`/app/t/${chat.id}`}>
          <MessageSquareIcon className="size-4 shrink-0 mt-0.5 transition-transform duration-200 group-hover/menu-button:scale-110" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate font-semibold text-sidebar-foreground">
              {chat.title}
            </span>
            <span className="line-clamp-1 text-xs text-muted-foreground/80 leading-tight">
              {chat.lastMessagePreview || 'No preview available'}
            </span>
          </div>
        </Link>
      </SidebarMenuButton>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            className="data-[state=open]:opacity-100 transition-opacity"
            aria-label={`Actions for ${chat.title}`}
          >
            <MoreHorizontal className="size-3.5" />
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="right" className="w-48">
          <DropdownMenuItem
            onClick={() =>
              archiveChat.mutate({ id: chat.id, isArchived: true })
            }
          >
            <ArchiveIcon className="size-4" />
            Archive Chat
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              setChatToDelete(chat);
              setDeleteDialogOpen(true);
            }}
          >
            <Trash2Icon className="size-4" />
            Delete Chat
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );

  const { state } = useSidebar();
  return (
    <>
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            {isEmptyLibrary ? (
              <SidebarMenuButton
                variant="outline"
                tooltip="New chat"
                className="group-data-[collapsible=icon]:justify-center"
                disabled
              >
                <PlusIcon />
                <span className="group-data-[collapsible=icon]:hidden">
                  New chat
                </span>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                asChild
                variant="outline"
                tooltip="New chat"
                className="group-data-[collapsible=icon]:justify-center"
              >
                <Link href="/app">
                  <PlusIcon />
                  <span className="group-data-[collapsible=icon]:hidden">
                    New chat
                  </span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      {isLoading ? (
        <SidebarGroup>
          {state === 'expanded' && (
            <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
          )}
          <SidebarMenu>
            {Array.from({ length: 6 }).map((_, index) => (
              <SidebarMenuItem key={`chat-skeleton-${index}`}>
                <SidebarMenuSkeleton
                  showIcon
                  width={['75%', '85%', '65%', '80%', '70%', '90%'][index % 6]}
                />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ) : (
        <>
          {!isLoading && state === 'expanded' && filteredChats.length === 0 && (
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem></SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )}

          {groupedChats.today.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel>Today</SidebarGroupLabel>
              <SidebarMenu>
                {groupedChats.today.map(renderChatItem)}
              </SidebarMenu>
            </SidebarGroup>
          )}

          {groupedChats.previous7Days.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel>Previous 7 Days</SidebarGroupLabel>
              <SidebarMenu>
                {groupedChats.previous7Days.map(renderChatItem)}
              </SidebarMenu>
            </SidebarGroup>
          )}

          {groupedChats.older.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel>Older</SidebarGroupLabel>
              <SidebarMenu>
                {groupedChats.older.map(renderChatItem)}
              </SidebarMenu>
            </SidebarGroup>
          )}
        </>
      )}

      <ConfirmationDialog
        open={deleteDialogOpen}
        openChangeAction={setDeleteDialogOpen}
        confirmAction={() => {
          if (chatToDelete) {
            deleteChat.mutate(chatToDelete.id);
            if (pathname.includes(chatToDelete.id)) {
              router.push('/app');
            }
          }
        }}
        isPending={deleteChat.isPending}
        title="Delete conversation?"
        description={`This will permanently delete "${chatToDelete?.title}" and its message history.`}
        confirmLabel="Delete conversation"
        tone="destructive"
      />
    </>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchFocusKey, setSearchFocusKey] = React.useState(0);
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar variant="sidebar" collapsible="icon" {...props}>
      <SidebarHeader className="pb-2 overflow-hidden">
        <div className="flex items-center justify-between gap-1 h-12 group-data-[collapsible=icon]:justify-center">
          <div
            className="flex-1 overflow-hidden transition-all duration-500 data-[collapsed=true]:w-0 data-[collapsed=true]:opacity-0"
            data-collapsed={isCollapsed}
          >
            <ApplicationIcon expanded={!isCollapsed} />
          </div>
          <SidebarTrigger
            className={cn(
              'shrink-0 transition-transform duration-300',
              isCollapsed && 'size-9 hover:bg-sidebar-accent',
            )}
          />
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <SidebarSearch
          value={searchQuery}
          onChange={setSearchQuery}
          focusKey={searchFocusKey}
          onRequestFocus={() => setSearchFocusKey((prev) => prev + 1)}
        />
        <SidebarChatList query={searchQuery} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail className="-right-2" />
    </Sidebar>
  );
}
