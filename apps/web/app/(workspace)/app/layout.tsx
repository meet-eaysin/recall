'use client';

import type { ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Dock } from '@/features/workspace/components/dock';
import { ThreadStreamProvider } from '@/features/workspace/components/thread-stream-context';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <ThreadStreamProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <main>{children}</main>

            <Dock />
          </SidebarInset>
        </SidebarProvider>
      </ThreadStreamProvider>
    </TooltipProvider>
  );
}
