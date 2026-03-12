'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Library,
  Waypoints,
  Settings,
  History,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const navItems = [
  { name: 'Workspace', href: '/app', icon: LayoutDashboard },
  { name: 'Library', href: '/app/library', icon: Library },
  { name: 'Graph', href: '/app/graph', icon: Waypoints },
  { name: 'Settings', href: '/app/settings', icon: Settings },
];

export function Dock() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-700 delay-500">
      <nav className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-background/60 backdrop-blur-xl border border-subtle shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)] ring-1 ring-white/10">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/app' && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Tooltip key={item.name}>
              <TooltipTrigger
                render={
                  <Link
                    href={item.href}
                    className={cn(
                      'relative p-3 rounded-xl transition-all duration-300 group hover:scale-110 active:scale-95',
                      isActive
                        ? 'bg-foreground text-background shadow-lg shadow-foreground/10'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  />
                }
              >
                <Icon className="size-5" />
                {isActive && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                )}
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="rounded-lg bg-foreground text-background border-0 mb-2"
              >
                <p className="text-xs font-medium">{item.name}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}

        <div className="w-px h-6 bg-subtle mx-1" />

        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent('mind-stack:toggle-threads'),
                  )
                }
                className="p-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-300 hover:scale-110 active:scale-95"
              />
            }
          >
            <History className="size-5" />
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="rounded-lg bg-foreground text-background border-0 mb-2"
          >
            <p className="text-xs font-medium">History (H)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                href="/app/library/new"
                className="p-3 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-115 transition-all duration-300 active:scale-95"
              />
            }
          >
            <Plus className="size-5" />
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="rounded-lg bg-foreground text-background border-0 mb-2"
          >
            <p className="text-xs font-medium">Add Quick (N)</p>
          </TooltipContent>
        </Tooltip>
      </nav>
    </div>
  );
}
