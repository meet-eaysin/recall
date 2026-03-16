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

const navItems = [
  { name: 'Workspace', href: '/app', icon: LayoutDashboard },
  { name: 'Library', href: '/app/library', icon: Library },
  { name: 'Graph', href: '/app/graph', icon: Waypoints },
  { name: 'Settings', href: '/app/settings', icon: Settings },
];

export function Dock() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <nav className="flex items-center gap-1 rounded-lg border bg-background p-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/app' && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Tooltip key={item.name}>
              <TooltipTrigger
                render={
                  <Button
                    render={<Link href={item.href} />}
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="icon"
                    aria-current={isActive ? 'page' : undefined}
                  />
                }
              >
                <Icon className="size-5" />
              </TooltipTrigger>
              <TooltipContent side="top">{item.name}</TooltipContent>
            </Tooltip>
          );
        })}

        <div className="mx-1 h-6 w-px bg-border" />

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent('mind-stack:toggle-threads'),
                  )
                }
                aria-label="History"
              />
            }
          >
            <History className="size-5" />
          </TooltipTrigger>
          <TooltipContent side="top">History (H)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                render={<Link href="/app/library/new" />}
                variant="default"
                size="icon"
                aria-label="Add Quick"
              />
            }
          >
            <Plus className="size-5" />
          </TooltipTrigger>
          <TooltipContent side="top">Add Quick (N)</TooltipContent>
        </Tooltip>
      </nav>
    </div>
  );
}
