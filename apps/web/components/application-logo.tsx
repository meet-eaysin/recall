'use client';

import Link from 'next/link';

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { RotateCcwSquare } from 'lucide-react';

export function ApplicationIcon() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          render={<Link href="/app" />}
          size="lg"
          className="hover:bg-sidebar-accent/50 transition-colors duration-200"
        >
          <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-linear-to-br from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20 transition-all duration-300 group-hover/menu-button:scale-105 group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:p-0">
            <RotateCcwSquare className="size-5 transition-transform duration-500 group-hover/menu-button:rotate-12 group-data-[collapsible=icon]:size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight ml-1">
            <span className="truncate font-bold tracking-tight text-sidebar-foreground">
              Recall
            </span>
            <span className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
              Workspace
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
