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
          <SidebarInset className="relative flex flex-col overflow-hidden bg-background">
            <main className="flex-1 overflow-auto">
              <div className="pb-24 flex min-h-full flex-col">
                {children}
              </div>
            </main>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
              <Dock />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </ThreadStreamProvider>
    </TooltipProvider>
  );
}
