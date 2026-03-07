import Link from 'next/link';
import { Navigation } from './navigation/navigation';
import { cn } from '@/lib/utils';
import { UserDropdown } from './user-dropdown/user-dropdown';
import { Blocks } from 'lucide-react';

export type SideBarProps = {
  bannersHeight?: number;
};

export function SideBarContainer(props: SideBarProps) {
  return <SideBar {...props} />;
}

export function SideBar({ bannersHeight = 0 }: SideBarProps) {
  const sidebarStylingAttributes = {
    maxHeight: `calc(100vh - ${bannersHeight}px)`,
    top: `${bannersHeight}px`,
  };

  return (
    <div className="relative">
      <aside
        style={sidebarStylingAttributes}
        className={cn(
          'bg-muted border-muted fixed left-0 hidden h-full w-14 flex-col overflow-y-auto overflow-x-hidden border-r md:sticky md:flex lg:w-56 lg:px-3',
          'max-h-screen',
        )}
      >
        <div className="flex h-full flex-col justify-between py-3 lg:pt-4">
          <header className="items-center justify-between md:hidden lg:flex">
            <UserDropdown />
          </header>
          {/* logo icon for tablet */}
          <Link href="/" className="text-center md:inline lg:hidden">
            <Blocks className="mx-auto h-6 w-6 text-primary" />
          </Link>
          <Navigation />
        </div>
      </aside>
    </div>
  );
}
