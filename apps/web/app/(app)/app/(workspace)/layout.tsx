'use client';

import type { ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Dock } from '@/features/workspace/components/dock';
import { ThreadPanel } from '@/features/workspace/components/thread-panel';
import { ThreadStreamProvider } from '@/features/workspace/components/thread-stream-context';

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <ThreadStreamProvider>
        <div className="relative flex h-screen flex-col bg-background text-foreground selection:bg-primary/10 overflow-hidden">
          <main className="relative flex flex-1 flex-col overflow-y-auto lg:pl-16">
            {children}
          </main>

          <Dock />
          <ThreadPanel />
        </div>
      </ThreadStreamProvider>
    </TooltipProvider>
  );
}
