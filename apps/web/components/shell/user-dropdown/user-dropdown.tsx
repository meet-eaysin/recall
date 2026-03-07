import { cn } from '@/lib/utils';
import {
  User as UserIcon,
  Settings as SettingsIcon,
  LogOut as LogOutIcon,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
} from 'lucide-react';

const signOut = (_options: { callbackUrl: string }) => {
  console.log('Mock sign out', _options);
};

import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';

import { ThemeToggle } from '../theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserDropdownProps {
  small?: boolean;
}

export function UserDropdown({ small }: UserDropdownProps) {
  const isPending = false;
  const user = { username: 'mockuser', name: 'Mock User', avatarUrl: '' };
  const pathname = usePathname();
  const isPlatformPages = pathname?.startsWith('/settings/platform');

  const [menuOpen, setMenuOpen] = useState(false);

  // Prevent rendering dropdown if user isn't available.
  if (!user && !isPending) {
    return null;
  }

  return (
    <Menu open={menuOpen} onOpenChange={setMenuOpen}>
      <MenuTrigger
        disabled={isPending}
        render={
          <button
            data-testid="user-dropdown-trigger-button"
            className={cn(
              'hover:bg-emphasis group mx-0 flex w-full cursor-pointer appearance-none items-center rounded-full text-left outline-none transition focus:outline-none focus:ring-0 md:rounded-none lg:rounded',
              small ? 'p-2' : 'px-2 py-1.5',
            )}
          />
        }
      >
        <span
          className={cn(
            small ? 'h-4 w-4' : 'h-5 w-5 ltr:mr-2 rtl:ml-2',
            'relative shrink-0 rounded-full',
          )}
        >
          <Avatar>
            <AvatarImage
              className={'size-5'}
              src={user.avatarUrl}
              alt="User avatar"
            />
            <AvatarFallback>{user.name}</AvatarFallback>
          </Avatar>
          <span
            className={cn(
              'border-muted absolute -bottom-1 -right-1 rounded-full border bg-green-500',
              small
                ? '-bottom-0.5 -right-0.5 h-2.5 w-2.5'
                : '-bottom-0.5 right-0 h-2 w-2',
            )}
          />
        </span>
        {!small && (
          <span className="flex grow items-center gap-2">
            <span className="w-24 shrink-0 text-sm leading-none">
              <span className="text-emphasis block truncate py-0.5 font-medium leading-normal">
                {isPending ? 'Loading...' : (user?.name ?? 'Nameless User')}
              </span>
            </span>
            {menuOpen ? (
              <ChevronUpIcon
                className="group-hover:text-subtle text-muted h-4 w-4 shrink-0 transition rtl:mr-4"
                aria-hidden="true"
              />
            ) : (
              <ChevronDownIcon
                className="group-hover:text-subtle text-muted h-4 w-4 shrink-0 transition rtl:mr-4"
                aria-hidden="true"
              />
            )}
          </span>
        )}
      </MenuTrigger>

      <MenuPopup align="start">
        {!isPlatformPages && (
          <>
            <MenuItem render={<Link href="/settings/my-account/profile" />}>
              <UserIcon />
              My Profile
            </MenuItem>
            <MenuItem render={<Link href="/settings" />}>
              <SettingsIcon />
              Settings
            </MenuItem>
            <div className="px-1 py-1">
              <ThemeToggle />
            </div>
            <MenuSeparator />
          </>
        )}

        <MenuItem
          variant="destructive"
          onClick={() => {
            signOut({ callbackUrl: '/auth/logout' });
          }}
        >
          <LogOutIcon />
          Sign Out
        </MenuItem>
      </MenuPopup>
    </Menu>
  );
}
