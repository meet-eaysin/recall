'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  Clock,
  ChevronRight,
  Search,
  Settings,
} from 'lucide-react';
import { useSearchChats } from '@/features/search/hooks';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

export function ThreadPanel() {
  const { data: chats, isLoading } = useSearchChats();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  // Keyboard shortcut and custom event to toggle panel
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'h' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    const handleToggle = () => setIsOpen((open) => !open);

    document.addEventListener('keydown', down);
    window.addEventListener('mind-stack:toggle-threads', handleToggle);
    return () => {
      document.removeEventListener('keydown', down);
      window.removeEventListener('mind-stack:toggle-threads', handleToggle);
    };
  }, []);

  return (
    <>
      {/* Persistent mini-sidebar on large screens */}
      <aside className="fixed top-0 left-0 h-screen w-0 lg:w-16 bg-background border-r border-subtle z-40 hidden lg:flex flex-col items-center py-4 gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="mb-2"
        >
          <Clock className="size-5" />
        </Button>
        <div className="w-8 h-px bg-subtle mx-auto mb-2" />
        {chats?.slice(0, 8).map((chat) => (
          <Link
            key={chat.id}
            href={`/app/t/${chat.id}`}
            className="size-10 rounded-xl bg-muted/30 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all duration-300 group relative"
          >
            <MessageSquare className="size-4" />
            <div className="absolute left-full ml-4 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
              {chat.title}
            </div>
          </Link>
        ))}
      </aside>

      {/* Main Drawer */}
      <Drawer direction="left" open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent className="h-full w-80 rounded-none border-r border-subtle">
          <DrawerHeader className="border-b border-subtle flex flex-row items-center justify-between px-4 shrink-0">
            <DrawerTitle className="text-sm font-semibold tracking-tight">
              Recent Threads
            </DrawerTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <ChevronRight className="rotate-180 size-5" />
            </Button>
          </DrawerHeader>

          <div className="flex-1 overflow-hidden flex flex-col pt-4">
            <div className="px-4 pb-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  placeholder="Search threads..."
                  className="w-full bg-muted/50 border-none rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <ScrollArea className="flex-1 px-2">
              <div className="space-y-1 pb-4">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-20 w-full animate-pulse rounded-xl bg-muted/50 mb-1"
                    />
                  ))
                ) : chats?.length === 0 ? (
                  <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                    No recent threads
                  </div>
                ) : (
                  chats?.map((chat) => {
                    const isActive = pathname.includes(chat.id);
                    return (
                      <Link
                        key={chat.id}
                        href={`/app/t/${chat.id}`}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          'group flex flex-col gap-1 p-3 rounded-xl transition-all duration-200',
                          isActive
                            ? 'bg-primary/10 border border-primary/20'
                            : 'hover:bg-muted border border-transparent',
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              'text-sm font-medium truncate',
                              isActive ? 'text-primary' : 'text-foreground',
                            )}
                          >
                            {chat.title}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 group-hover:text-muted-foreground/80 transition-colors">
                          {chat.lastMessagePreview || 'No preview available'}
                        </p>
                      </Link>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="p-4 border-t border-subtle bg-muted/10">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 rounded-xl text-xs"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="size-3" />
              View All History
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
