import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Dock } from '@/features/workspace/components/dock';
import { ThreadStreamProvider } from '@/features/workspace/components/thread-stream-context';
import { AppSidebar } from '@/components/app-sidebar';
import { LogoIcon } from '@/components/application-logo';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { ConsentProvider } from '@/providers/consent-provider';

export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  return (
    <ConsentProvider>
      <TooltipProvider>
        <ThreadStreamProvider>
          <SidebarProvider defaultOpen={defaultOpen}>
            <div className="relative flex min-h-svh w-full overflow-hidden bg-background">
              <AppSidebar />
              <SidebarInset className="relative flex min-h-svh flex-1 flex-col overflow-hidden">
                {/* Mobile Header */}
                <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 md:hidden">
                  <LogoIcon className="size-8" />
                  <div className="flex-1 font-bold text-sm tracking-tight">
                    Recall
                  </div>
                  <SidebarTrigger />
                </header>
                <main className="relative flex flex-1 flex-col overflow-hidden">
                  {children}
                </main>
              </SidebarInset>
            </div>
            <Dock />
          </SidebarProvider>
        </ThreadStreamProvider>
      </TooltipProvider>
    </ConsentProvider>
  );
}
