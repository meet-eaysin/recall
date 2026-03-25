'use client';

import Link from 'next/link';
import { RotateCcwSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LogoIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex aspect-square size-9 items-center justify-center rounded-xl bg-linear-to-br from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20 transition-all duration-300',
        className,
      )}
    >
      <RotateCcwSquare className="size-5 transition-transform duration-500 group-hover/logo:rotate-12" />
    </div>
  );
}

export function ApplicationIcon({ expanded = true }: { expanded?: boolean }) {
  return (
    <Link
      href="/app"
      className="group/logo flex items-center gap-2 rounded-lg transition-colors"
    >
      <LogoIcon className={expanded ? 'size-9' : 'size-8'} />
      {expanded && (
        <div className="grid flex-1 text-left text-sm leading-tight ml-1">
          <span className="truncate font-bold tracking-tight text-sidebar-foreground">
            Recall
          </span>
          <span className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Workspace
          </span>
        </div>
      )}
    </Link>
  );
}
