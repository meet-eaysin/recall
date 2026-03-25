import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Dock } from '@/features/workspace/components/dock';
import { ThreadStreamProvider } from '@/features/workspace/components/thread-stream-context';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  return (
    <TooltipProvider>
      <ThreadStreamProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <>
            <div className="relative flex min-h-svh w-full">
              <AppSidebar />
              <SidebarInset className="relative flex min-h-svh flex-1 flex-col bg-background">
                <div className="pointer-events-none sticky top-0 z-50 flex h-14 w-full items-center px-4 md:px-6">
                  <SidebarTrigger className="pointer-events-auto -ml-1" />
                </div>
                <main className="relative flex flex-1 flex-col -mt-14">
                  {children}
                </main>
              </SidebarInset>
            </div>
            <Dock />
          </>
        </SidebarProvider>
      </ThreadStreamProvider>
    </TooltipProvider>
  );
}
