'use client';

import Link from 'next/link';
import { Trash2, Archive, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Menu, MenuTrigger, MenuPopup, MenuItem } from '@/components/ui/menu';
import { formatDistanceToNow } from 'date-fns';

interface ThreadItemChat {
  id: string;
  title: string;
  lastMessagePreview?: string | null;
  updatedAt: string;
}

interface ThreadItemProps {
  chat: ThreadItemChat;
  isActive: boolean;
  isExpanded: boolean;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ThreadItem({
  chat,
  isActive,
  isExpanded,
  onArchive,
  onDelete,
}: ThreadItemProps) {
  return (
    <div className="relative group/item mb-1">
      <Link
        href={`/app/t/${chat.id}`}
        className={cn(
          'flex transition-all duration-150 rounded-xl border border-transparent overflow-hidden',
          isExpanded
            ? 'p-3.5 pr-12 w-full flex-col gap-1.5'
            : 'size-10 items-center justify-center mx-auto',
          isActive ? 'bg-primary/10 border-primary/20' : 'hover:bg-muted/80',
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
              {chat.lastMessagePreview || 'No preview available'}
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
                {formatDistanceToNow(new Date(chat.updatedAt))} ago
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
            <MenuPopup side="right" align="start" className="min-w-32">
              <MenuItem onSelect={() => onArchive(chat.id)}>
                <Archive className="size-4 mr-2" />
                <span>Archive</span>
              </MenuItem>
              <MenuItem
                onSelect={() => onDelete(chat.id)}
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
}
