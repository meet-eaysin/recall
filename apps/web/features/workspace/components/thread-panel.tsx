'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Clock,
  ChevronRight,
  Search,
  Settings,
  Trash2,
  Archive,
  MoreVertical,
  Trash,
} from 'lucide-react';
import {
  useSearchChats,
  useDeleteChat,
  useArchiveChat,
  useClearHistory,
} from '@/features/search/hooks';
import { LogoIcon } from '@/components/logo';
import { UserDropdown } from '@/components/shell/user-dropdown/user-dropdown';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Menu, MenuTrigger, MenuPopup, MenuItem } from '@/components/ui/menu';
import { formatDistanceToNow } from 'date-fns';

export function ThreadPanel() {
  const { data: chats, isLoading } = useSearchChats();
  const deleteChat = useDeleteChat();
  const archiveChat = useArchiveChat();
  const clearHistory = useClearHistory();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredChats = React.useMemo(() => {
    if (!chats) return [];
    if (!searchQuery.trim()) return chats;
    const query = searchQuery.toLowerCase();
    return chats.filter(
      (chat) =>
        chat.title.toLowerCase().includes(query) ||
        chat.lastMessagePreview?.toLowerCase().includes(query),
    );
  }, [chats, searchQuery]);

  // Keyboard shortcut and custom event to toggle panel
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'h' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsExpanded((prev) => !prev);
      }
    };

    const handleToggle = () => setIsExpanded((prev) => !prev);

    document.addEventListener('keydown', down);
    window.addEventListener('mind-stack:toggle-threads', handleToggle);
    return () => {
      document.removeEventListener('keydown', down);
      window.removeEventListener('mind-stack:toggle-threads', handleToggle);
    };
  }, []);

  return (
    <>
      <aside
        className={cn(
          'fixed top-0 left-0 h-screen bg-background border-r border-subtle z-30 hidden lg:flex flex-col transition-[width] duration-300 ease-in-out shadow-[1px_0_10px_rgba(0,0,0,0.02)] overflow-hidden',
          isExpanded ? 'w-80' : 'w-16',
        )}
      >
        {/* Top Header Section */}
        <div className="flex items-center px-4 py-6 mb-2 h-20 shrink-0 relative">
          <Link href="/" className="group relative flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center transition-all group-hover:scale-105 group-hover:bg-primary/20 shrink-0">
              <LogoIcon className="size-6 text-primary" />
            </div>
            <div
              className={cn(
                'flex flex-col transition-all duration-300 origin-left overflow-hidden',
                isExpanded
                  ? 'opacity-100 w-32 ml-0'
                  : 'opacity-0 w-0 -ml-2 pointer-events-none',
              )}
            >
              <span className="text-sm font-bold tracking-tight whitespace-nowrap text-foreground/90">
                dev.me
              </span>
              <Badge
                variant="outline"
                size="sm"
                className="w-fit h-3.5 px-1 py-0 text-[8px] font-bold opacity-70"
              >
                BETA
              </Badge>
            </div>
            <Badge
              variant="default"
              size="sm"
              className={cn(
                'absolute -top-1 -right-1 px-1 h-3.5 min-w-8 text-[8px] font-black tracking-tighter transition-all duration-300',
                isExpanded
                  ? 'opacity-0 scale-50 pointer-events-none'
                  : 'opacity-100 scale-100',
              )}
            >
              BETA
            </Badge>
          </Link>
          <div
            className={cn(
              'absolute right-4 transition-all duration-300',
              isExpanded
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-50 pointer-events-none',
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(false)}
              className="size-8 rounded-lg"
            >
              <ChevronRight className="rotate-180 size-5" />
            </Button>
          </div>
        </div>

        {/* Search & Toggle Section */}
        <div className="px-3 mb-4 h-10 shrink-0">
          <div className="relative h-10 w-full">
            <div
              className={cn(
                'absolute inset-0 transition-all duration-300',
                isExpanded
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-95 pointer-events-none',
              )}
            >
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  placeholder="Search threads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-muted/50 border-none rounded-xl h-10 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
                />
              </div>
            </div>
            <div
              className={cn(
                'absolute inset-0 transition-all duration-300 flex justify-center',
                !isExpanded
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-95 pointer-events-none',
              )}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(true)}
                className="size-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all group relative"
              >
                <Clock className="size-5" />
                <div className="absolute left-full ml-4 px-3 py-1.5 rounded-lg bg-foreground text-background text-[10px] font-bold tracking-wider uppercase whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-70 shadow-xl">
                  Recent History
                </div>
              </Button>
            </div>
          </div>
        </div>

        <div className="w-8 h-px bg-linear-to-r from-transparent via-subtle to-transparent mx-auto mb-2 shrink-0" />

        {/* Content Section */}
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1 pb-4">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-full animate-pulse rounded-xl bg-muted/50 mb-1',
                      isExpanded ? 'h-20' : 'h-10',
                    )}
                  />
                ))
              : filteredChats.map((chat) => {
                  const isActive = pathname.includes(chat.id);
                  return (
                    <div key={chat.id} className="relative group/item mb-1">
                      <Link
                        href={`/app/t/${chat.id}`}
                        className={cn(
                          'flex transition-all duration-300 rounded-xl border border-transparent overflow-hidden',
                          isExpanded
                            ? 'p-3.5 pr-12 w-full flex-col gap-1.5'
                            : 'size-10 items-center justify-center mx-auto',
                          isActive
                            ? 'bg-primary/10 border-primary/20'
                            : 'hover:bg-muted/80',
                        )}
                      >
                        {/* Expanded: full title + preview */}
                        {isExpanded && (
                          <div className="flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between gap-2 overflow-hidden">
                              <span
                                className={cn(
                                  'text-sm font-semibold truncate transition-colors whitespace-nowrap',
                                  isActive
                                    ? 'text-primary'
                                    : 'text-foreground group-hover/item:text-primary/80',
                                )}
                              >
                                {chat.title}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground/80 line-clamp-2 leading-relaxed">
                              {chat.lastMessagePreview ||
                                'No preview available'}
                            </p>
                          </div>
                        )}

                        {/* Collapsed: first letter badge */}
                        {!isExpanded && (
                          <div className="flex items-center justify-center relative shrink-0 size-10">
                            <div
                              className={cn(
                                'size-8 rounded-lg flex items-center justify-center text-[11px] font-bold transition-all',
                                isActive
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground group-hover/item:bg-primary/10 group-hover/item:text-primary',
                              )}
                            >
                              {chat.title.charAt(0).toUpperCase()}
                            </div>
                            {isActive && (
                              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-full shadow-[0_0_10px_var(--primary)]" />
                            )}
                            <div className="absolute left-full ml-4 px-3 py-2 rounded-lg bg-background border border-subtle text-foreground text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover/item:opacity-100 transition-opacity z-70 shadow-2xl min-w-[120px]">
                              <p className="font-semibold truncate max-w-[180px]">
                                {chat.title}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {formatDistanceToNow(new Date(chat.updatedAt))}{' '}
                                ago
                              </p>
                            </div>
                          </div>
                        )}
                      </Link>

                      {isExpanded && (
                        <div className="absolute right-2 top-8 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center gap-1">
                          <Menu>
                            <MenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 rounded-lg hover:bg-muted-foreground/10"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="size-4" />
                                </Button>
                              }
                            />
                            <MenuPopup
                              side="right"
                              align="start"
                              className="min-w-32"
                            >
                              <MenuItem
                                onSelect={() =>
                                  archiveChat.mutate({
                                    id: chat.id,
                                    isArchived: true,
                                  })
                                }
                              >
                                <Archive className="size-4 mr-2" />
                                <span>Archive</span>
                              </MenuItem>
                              <MenuItem
                                onSelect={() => deleteChat.mutate(chat.id)}
                                variant="destructive"
                              >
                                <Trash2 className="size-4 mr-2" />
                                <span>Delete</span>
                              </MenuItem>
                            </MenuPopup>
                          </Menu>
                        </div>
                      )}
                    </div>
                  );
                })}
          </div>
        </ScrollArea>

        {/* Footer Section */}
        <div className="mt-auto p-3 border-t border-subtle bg-muted/5 shrink-0">
          {/* Expanded footer actions */}
          {isExpanded && (
            <div className="flex flex-col gap-1.5 mb-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 rounded-xl text-[10px] h-8 font-semibold hover:bg-primary/5 hover:border-primary/30 transition-all border-dashed"
              >
                <Settings className="size-3" />
                Manage History
              </Button>
              <ConfirmationDialog
                title="Clear Chat History"
                description="Are you sure you want to clear all your chat history? This action cannot be undone."
                confirmLabel="Clear All"
                tone="destructive"
                onConfirm={() => clearHistory.mutate()}
                trigger={
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 rounded-xl text-[10px] h-8 font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive transition-all"
                  >
                    <Trash className="size-3" />
                    Clear History
                  </Button>
                }
              />
            </div>
          )}

          {/* UserDropdown — always visible */}
          <div className="flex items-center justify-center">
            <UserDropdown small={!isExpanded} />
          </div>
        </div>
      </aside>
    </>
  );
}
