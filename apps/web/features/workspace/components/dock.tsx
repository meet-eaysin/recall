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
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSidebar } from '@/components/ui/sidebar';
import { AddDocumentDialog } from '@/features/library/components/add-document-dialog';

const navItems = [
  { name: 'Workspace', href: '/app', icon: LayoutDashboard },
  { name: 'Library', href: '/app/library', icon: Library },
  { name: 'Graph', href: '/app/graph', icon: Waypoints },
  { name: 'Settings', href: '/app/settings', icon: Settings },
];

export function Dock() {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();

  return (
    <div className="fixed bottom-6 left-1/2 z-100 w-max -translate-x-1/2 max-w-[calc(100vw-2rem)]">
      <nav className="flex items-center gap-1 rounded-full border border-border/40 bg-background/60 backdrop-blur-2xl p-1.5 shadow-2xl shadow-black/10 dark:shadow-black/40">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/app' && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="icon"
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Link href={item.href}>
                    <Icon className="size-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">{item.name}</TooltipContent>
            </Tooltip>
          );
        })}

        <div className="mx-1 h-6 w-px bg-border" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              aria-label="History"
            >
              <History className="size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">History (H)</TooltipContent>
        </Tooltip>

        <AddDocumentDialog
          trigger={
            <Button
              variant="default"
              size="icon"
              aria-label="Add Quick"
              title="Add Quick (N)"
            >
              <Plus className="size-5" />
            </Button>
          }
        />
      </nav>
    </div>
  );
}
