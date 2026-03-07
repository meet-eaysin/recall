'use client';

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
import { useState } from 'react';

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

  if (!user && !isPending) {
    return null;
  }

  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Menu open={menuOpen} onOpenChange={setMenuOpen}>
      <MenuTrigger
        disabled={isPending}
        render={
          <button
            data-testid="user-dropdown-trigger-button"
            className={cn(
              'hover:bg-subtle group flex w-full cursor-pointer items-center gap-2 rounded-md text-left outline-none transition focus:outline-none focus:ring-0',
              small ? 'justify-center p-1.5' : 'px-2 py-1.5',
            )}
          />
        }
      >
        <span className="relative shrink-0">
          <Avatar className="size-7">
            <AvatarImage src={user.avatarUrl} alt="User avatar" />
            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span
            className="border-background absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-[1.5px] bg-green-500"
            aria-label="Online"
          />
        </span>

        {!small && (
          <span className="flex min-w-0 flex-1 items-center justify-between gap-1">
            <span className="min-w-0">
              <span className="text-emphasis block truncate text-sm font-medium leading-tight">
                {isPending ? 'Loading…' : (user?.name ?? 'Nameless User')}
              </span>
              <span className="text-subtle block truncate text-xs leading-tight">
                @{user.username}
              </span>
            </span>
            {menuOpen ? (
              <ChevronUpIcon
                className="text-muted h-3.5 w-3.5 shrink-0 transition"
                aria-hidden="true"
              />
            ) : (
              <ChevronDownIcon
                className="text-muted h-3.5 w-3.5 shrink-0 transition"
                aria-hidden="true"
              />
            )}
          </span>
        )}
      </MenuTrigger>

      <MenuPopup align="start" sideOffset={6}>
        <div className="px-2 py-2">
          <p className="text-emphasis text-sm font-medium leading-tight">
            {user.name}
          </p>
          <p className="text-subtle text-xs">@{user.username}</p>
        </div>
        <MenuSeparator />

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
