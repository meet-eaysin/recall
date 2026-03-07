import Link from 'next/link';
import { UserDropdown } from './user-dropdown/user-dropdown';
import { Blocks, SettingsIcon } from 'lucide-react';

export function TopNavContainer() {
  return <TopNav />;
}

function TopNav() {
  return (
    <nav className="bg-muted/50 border-subtle sticky top-0 z-40 flex w-full items-center justify-between border-b px-4 py-1.5 backdrop-blur-lg sm:p-4 md:hidden">
      <Link href="/">
        <Blocks className="h-6 w-6 text-primary" />
      </Link>
      <div className="flex items-center gap-2 self-center">
        <button className="hover:bg-muted hover:text-subtle text-muted rounded-full p-1 transition focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2">
          <span className="sr-only">Settings</span>
          <Link href="/settings">
            <SettingsIcon className="text-default h-4 w-4" />
          </Link>
        </button>
        <UserDropdown small />
      </div>
    </nav>
  );
}
