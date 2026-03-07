import Link from 'next/link';
import { Navigation } from './navigation/navigation';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { NavIcon } from './navigation/nav-icon';

export type SideBarProps = {
  bannersHeight?: number;
};

const utilityLinks = [
  { name: 'View public page', href: '#', icon: 'external-link' as const },
  { name: 'Copy public page link', href: '#', icon: 'link-2' as const },
  { name: 'Refer and earn', href: '#', icon: 'gift' as const },
];

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
          'bg-muted sticky left-0 top-0 hidden h-screen w-14 flex-col overflow-y-auto overflow-x-hidden border-r border-subtle md:flex lg:w-72',
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-subtle px-3">
            <button
              type="button"
              className="hover:bg-subtle hidden items-center gap-2 rounded-md px-1.5 py-1 transition lg:flex"
            >
              <Avatar className="h-5 w-5">
                <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-semibold">
                  E
                </AvatarFallback>
              </Avatar>
              <span className="text-default truncate text-sm font-semibold">
                Eaysin Mia
              </span>
              <NavIcon name="chevron-down" className="text-muted h-3.5 w-3.5" />
            </button>
            <Link
              href="/"
              className="hover:bg-subtle flex items-center rounded-md p-2 transition lg:hidden"
              aria-label="Go to dashboard"
            >
              <NavIcon name="blocks" className="h-4 w-4" />
            </Link>
            <button
              type="button"
              className="text-default hover:bg-subtle hidden rounded-md p-2 transition lg:inline-flex"
              aria-label="Search"
            >
              <NavIcon name="search" className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 md:px-2 lg:px-3">
            <Navigation />
          </div>

          <div className="shrink-0 border-t border-subtle px-3 py-3">
            <nav className="hidden flex-col gap-1 lg:flex">
              {utilityLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-muted hover:text-default hover:bg-subtle flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold transition"
                >
                  <NavIcon name={link.icon} className="h-3.5 w-3.5 shrink-0" />
                  <span>{link.name}</span>
                </Link>
              ))}
            </nav>
            <Link
              href="/settings"
              className="text-default hover:bg-subtle mt-2 hidden items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold transition lg:flex"
            >
              <NavIcon name="settings" className="h-4 w-4 shrink-0" />
              <span>Settings</span>
            </Link>
            <div className="text-subtle mt-2 hidden text-[11px] lg:block">
              © 2026 MindStack, Inc.
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
