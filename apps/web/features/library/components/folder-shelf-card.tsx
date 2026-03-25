import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Folder, FolderOpen } from 'lucide-react';
import { FolderActions } from './folder-actions';
import { cn } from '@/lib/utils';
import type { FolderRow } from '../types';

interface FolderShelfCardProps {
  active: boolean;
  folder: FolderRow;
  onClick: () => void;
}

export function FolderShelfCard({
  active,
  folder,
  onClick,
}: FolderShelfCardProps) {
  const folderColor = folder.color;

  return (
    <TooltipProvider delayDuration={700}>
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        aria-pressed={active}
        aria-label={`${folder.name} folder${active ? ', currently viewing' : ''}`}
        className={cn(
          'group relative w-full cursor-pointer rounded-xl border text-left outline-none',
          'transition-[border-color,box-shadow] duration-150',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'hover:border-border hover:shadow-sm',
          active
            ? 'border-primary/30 shadow-[0_0_0_1px_hsl(var(--primary)/0.12)]'
            : 'border-border/50',
        )}
        style={
          folderColor
            ? {
                backgroundColor: `color-mix(in srgb, ${folderColor} 8%, hsl(var(--card)))`,
              }
            : { backgroundColor: 'hsl(var(--card))' }
        }
      >
        {/* Active left-rail indicator */}
        {active && (
          <span
            aria-hidden
            className="absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-primary"
          />
        )}

        <div className="flex flex-col gap-3 p-3">
          {/* Row 1: icon · name · timestamp · actions */}
          <div className="flex items-center gap-2.5">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-lg"
              style={
                folderColor
                  ? {
                      backgroundColor: `color-mix(in srgb, ${folderColor} 15%, hsl(var(--background)))`,
                    }
                  : { backgroundColor: 'hsl(var(--muted))' }
              }
            >
              {active ? (
                <FolderOpen
                  className="size-[18px]"
                  style={{
                    color: folderColor ?? 'hsl(var(--muted-foreground))',
                  }}
                />
              ) : (
                <Folder
                  className="size-[18px]"
                  style={{
                    color: folderColor ?? 'hsl(var(--muted-foreground))',
                  }}
                />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-0.5 pt-px">
              <p className="truncate text-sm font-semibold leading-tight tracking-tight text-foreground">
                {folder.name}
              </p>
              <p className="text-[11px] leading-none text-muted-foreground">
                Updated{' '}
                {formatDistanceToNow(new Date(folder.updatedAt || Date.now()), {
                  addSuffix: true,
                })}
              </p>
            </div>

            {/* Contextual actions — visible on hover/keyboard focus only */}
            <div
              className="shrink-0 opacity-0 transition-opacity duration-100 group-hover:opacity-100 group-focus-within:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <FolderActions folder={folder} />
            </div>
          </div>

          {/* Row 2: status badge · truncated id */}
          <div className="flex items-center justify-between gap-2">
            <Badge
              variant={active ? 'default' : 'secondary'}
              className="h-5 rounded-md px-1.5 text-[10px] font-medium"
            >
              {active ? 'Viewing' : 'Folder'}
            </Badge>

            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-default font-mono text-[10px] text-muted-foreground/50 transition-colors duration-100 hover:text-muted-foreground">
                  #{folder.id.slice(0, 8)}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-mono text-xs">
                {folder.id}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
