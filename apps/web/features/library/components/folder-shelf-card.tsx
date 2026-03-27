import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
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
        'group relative flex h-full flex-col overflow-hidden rounded-xl border border-border transition-all duration-200',
        'hover:shadow-md',
        active ? 'ring-2 ring-primary ring-offset-2' : '',
      )}
      style={
        folderColor
          ? {
              backgroundColor: `color-mix(in srgb, ${folderColor} 10%, hsl(var(--card)))`,
            }
          : { backgroundColor: 'hsl(var(--card))' }
      }
    >
      {/* Top Preview Area matching Document Preview exactly */}
      <div className="relative border-b border-border p-1.5">
        <div
          className="relative flex min-h-[124px] items-center justify-center overflow-hidden rounded-lg transition-transform group-hover:scale-[1.01]"
          style={{
            backgroundColor: folderColor
              ? `color-mix(in srgb, ${folderColor} 15%, hsl(var(--muted)/0.3))`
              : 'hsl(var(--muted)/0.2)',
          }}
        >
          {/* Sophisticated Pattern */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
              backgroundSize: '12px 12px',
            }}
          />

          <div className="flex size-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-xs">
            {active ? (
              <FolderOpen
                className="size-6 transition-colors"
                style={{ color: folderColor ?? 'var(--muted-foreground)' }}
              />
            ) : (
              <Folder
                className="size-6 transition-colors"
                style={{ color: folderColor ?? 'var(--muted-foreground)' }}
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-2.5">
        {/* Row 1: icon · metadata */}
        <div className="flex items-start gap-2">
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-lg shadow-sm"
            style={
              folderColor
                ? {
                    backgroundColor: `color-mix(in srgb, ${folderColor} 20%, hsl(var(--background)))`,
                    color: folderColor,
                  }
                : { backgroundColor: 'hsl(var(--muted))' }
            }
          >
            <Folder className="size-4" />
          </div>

          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-[11px] font-semibold tracking-wide text-muted-foreground/80">
                Folder
              </span>
              <Badge
                variant={active ? 'default' : 'secondary'}
                className="h-4 px-1 text-[10px] font-bold"
              >
                {active ? 'Viewing' : 'Open'}
              </Badge>
            </div>
            <p className="text-[11px] font-medium leading-none text-muted-foreground/60">
              Updated{' '}
              {formatDistanceToNow(new Date(folder.updatedAt || Date.now()), {
                addSuffix: true,
              })}
            </p>
          </div>

          <div
            className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <FolderActions folder={folder} />
          </div>
        </div>

        {/* Content Section: Title & Description */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <h3 className="line-clamp-1 text-[14px] font-semibold leading-tight tracking-tight text-foreground">
            {folder.name}
          </h3>
          <p className="line-clamp-2 text-[12px] leading-snug text-muted-foreground/70">
            {folder.description ||
              'Collection of managed documents and research materials.'}
          </p>
        </div>

        {/* Bottom Metadata */}
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="flex min-w-0 items-baseline gap-1.5 opacity-60">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              ID
            </span>
            <span className="truncate font-mono text-[10px] tracking-tighter">
              #{folder.id.slice(0, 8)}
            </span>
          </div>
          <div className="flex items-center gap-2 pb-0.5">
            <span className="shrink-0 text-[11px] font-bold text-muted-foreground/80">
              {active ? 'Active' : 'Private'}
            </span>
            <div
              className="size-2 rounded-full ring-2 ring-background shadow-lg"
              style={{ backgroundColor: folderColor ?? 'var(--muted)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
