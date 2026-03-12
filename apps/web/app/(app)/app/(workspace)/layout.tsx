'use client';

import type { ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Dock } from '@/features/workspace/components/dock';
import { ThreadPanel } from '@/features/workspace/components/thread-panel';

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <div className="relative flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/10">
        <main className="relative flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8 lg:px-12">
            <div className="mx-auto max-w-5xl">
              {children}
            </div>
          </div>
        </main>

        <Dock />
        <ThreadPanel />
      </div>
    </TooltipProvider>
  );
}
