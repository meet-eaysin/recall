'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Clock, ChevronRight, Search } from 'lucide-react';
import { useSearchChats } from '@/features/search/hooks';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

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
      {/* Trigger Overlay when open on mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* The Panel */}
      <aside 
        className={cn(
          "fixed top-0 right-0 h-screen bg-background border-l border-subtle z-50 transition-all duration-500 ease-in-out shadow-2xl flex flex-col",
          isOpen ? "w-80 translate-x-0" : "w-0 translate-x-full lg:w-16 lg:translate-x-0"
        )}
      >
        {/* Toggle Button Container */}
        <div className="flex h-16 items-center border-b border-subtle px-4 shrink-0">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsOpen(!isOpen)}
            className={cn("transition-transform duration-500", isOpen && "rotate-180")}
          >
            {isOpen ? <ChevronRight className="size-5" /> : <Clock className="size-5" />}
          </Button>
          {isOpen && (
            <span className="ml-3 font-semibold text-sm tracking-tight">Recent Threads</span>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {isOpen ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-4">
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
                      <div key={i} className="h-16 w-full animate-pulse rounded-xl bg-muted/50 mb-1" />
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
                          className={cn(
                            "group flex flex-col gap-1 p-3 rounded-xl transition-all duration-200",
                            isActive 
                              ? "bg-primary/10 border border-primary/20" 
                              : "hover:bg-muted border border-transparent"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={cn(
                              "text-sm font-medium truncate",
                              isActive ? "text-primary" : "text-foreground"
                            )}>
                              {chat.title}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1 group-hover:text-muted-foreground/80 transition-colors">
                            {chat.lastMessagePreview || "No preview available"}
                          </p>
                        </Link>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="hidden lg:flex flex-col items-center py-4 gap-4">
              {chats?.slice(0, 5).map((chat) => (
                <Link
                  key={chat.id}
                  href={`/app/t/${chat.id}`}
                  className="size-10 rounded-xl bg-muted/30 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all duration-300 group relative"
                >
                  <MessageSquare className="size-4" />
                  <div className="absolute right-full mr-4 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
                    {chat.title}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer / Settings Shortcut */}
        {isOpen && (
          <div className="p-4 border-t border-subtle bg-muted/10">
            <Button variant="outline" className="w-full justify-start gap-2 rounded-xl text-xs" render={<Link href="/app/settings" />}>
               Clear History
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
