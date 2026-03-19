import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Dock } from '@/features/workspace/components/dock';
import { ThreadStreamProvider } from '@/features/workspace/components/thread-stream-context';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

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
              <SidebarInset className="relative flex min-h-svh flex-1 flex-col bg-background md:pl-(--sidebar-width-icon)">
                <main className="relative flex flex-1 flex-col pt-2">
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
