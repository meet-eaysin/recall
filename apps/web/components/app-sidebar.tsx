'use client';

import * as React from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isToday, subDays, isAfter } from 'date-fns';

import {
  useArchiveChat,
  useDeleteChat,
  useSearchChats,
} from '@/features/search/hooks';
import { NavUser } from '@/components/nav-user';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarInput,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  SearchIcon,
  MessageSquareIcon,
  ArchiveIcon,
  Trash2Icon,
  PlusIcon,
} from 'lucide-react';
import { ApplicationIcon } from './application-logo';

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

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        {state === 'collapsed' ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Search"
                className="justify-center"
                onClick={() => {
                  onRequestFocus();
                  setOpen(true);
                }}
              >
                <SearchIcon />
                <span className="group-data-[collapsible=icon]:hidden">
                  Search
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          <SidebarInput
            key={`search-input-${focusKey}`}
            placeholder="Search chats..."
            value={value}
            onChange={(event) => onChange(event.target.value)}
            autoFocus={focusKey > 0}
          />
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function SidebarChatList({ query }: { query: string }) {
  const { data: chats, isLoading } = useSearchChats();
  const pathname = usePathname();
  const archiveChat = useArchiveChat();
  const deleteChat = useDeleteChat();

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
      <div className="flex items-start gap-2">
        <SidebarMenuButton
          render={<Link href={`/app/t/${chat.id}`} />}
          isActive={pathname.includes(chat.id)}
          tooltip={chat.title}
          className="h-auto flex-1 items-start gap-2 py-2 group-data-[collapsible=icon]:justify-center"
        >
          <MessageSquareIcon className="mt-0.5" />
          <span className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate">{chat.title}</span>
            <span className="line-clamp-1 text-xs text-muted-foreground">
              {chat.lastMessagePreview || 'No preview available'}
            </span>
          </span>
        </SidebarMenuButton>
        <div className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              archiveChat.mutate({ id: chat.id, isArchived: true });
            }}
            aria-label={`Archive ${chat.title}`}
          >
            <ArchiveIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              deleteChat.mutate(chat.id);
            }}
            aria-label={`Delete ${chat.title}`}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      </div>
    </SidebarMenuItem>
  );

  return (
    <>
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/app" />}
              variant="outline"
              tooltip="New chat"
              className="group-data-[collapsible=icon]:justify-center"
            >
              <PlusIcon />
              <span className="group-data-[collapsible=icon]:hidden">
                New chat
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      {isLoading ? (
        <SidebarGroup>
          <SidebarMenu>
            {Array.from({ length: 6 }).map((_, index) => (
              <SidebarMenuItem key={`chat-skeleton-${index}`}>
                <SidebarMenuSkeleton showIcon />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ) : (
        <>
          {!isLoading && filteredChats.length === 0 && (
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <div className="px-2 py-1 text-xs text-muted-foreground">
                    No chats found.
                  </div>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )}
          
          {groupedChats.today.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel>Today</SidebarGroupLabel>
              <SidebarMenu>{groupedChats.today.map(renderChatItem)}</SidebarMenu>
            </SidebarGroup>
          )}
          
          {groupedChats.previous7Days.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel>Previous 7 Days</SidebarGroupLabel>
              <SidebarMenu>{groupedChats.previous7Days.map(renderChatItem)}</SidebarMenu>
            </SidebarGroup>
          )}

          {groupedChats.older.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel>Older</SidebarGroupLabel>
              <SidebarMenu>{groupedChats.older.map(renderChatItem)}</SidebarMenu>
            </SidebarGroup>
          )}
        </>
      )}
    </>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchFocusKey, setSearchFocusKey] = React.useState(0);

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <div className="flex size-full flex-col">
        <SidebarHeader>
          <ApplicationIcon />
        </SidebarHeader>
        <SidebarContent>
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
        <SidebarRail />
      </div>
    </Sidebar>
  );
}
