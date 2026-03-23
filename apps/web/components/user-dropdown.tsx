'use client';

import { cn } from '@/lib/utils';
import {
  User as UserIcon,
  Settings as SettingsIcon,
  LogOut as LogOutIcon,
  ChevronDown as ChevronDownIcon,
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { ThemeToggle } from './theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthSession, useLogout } from '@/features/auth/hooks';

interface UserDropdownProps {
  small?: boolean;
}

export function UserDropdown({ small }: UserDropdownProps) {
  const { data: session, status } = useAuthSession();
  const logout = useLogout();
  const router = useRouter();
  const pathname = usePathname();
  const isPlatformPages = pathname?.startsWith('/app/settings/platform');

  const user = useMemo(() => {
    if (!session?.user) return null;
    const displayName = session.user.name ?? 'Nameless User';
    const email = session.user.email ?? '';
    const username = email.includes('@')
      ? (email.split('@')[0] ?? 'user')
      : email || displayName.replace(/\s+/g, '').toLowerCase();
    return {
      name: displayName,
      username,
      email,
      avatarUrl: session.user.avatarUrl ?? '',
      provider: session.user.provider ?? undefined,
    };
  }, [session?.user]);

  const isPending = status === 'loading' || logout.isPending;

  if (!user && !isPending) {
    return null;
  }

  const initials = (user?.name ?? 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'hover:bg-subtle data-[state=open]:bg-subtle group flex w-full items-center gap-2 rounded-md text-left outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
          small ? 'justify-center p-1.5' : 'px-2 py-1.5',
        )}
        disabled={isPending}
        data-testid="user-dropdown-trigger-button"
      >
        <span className="relative shrink-0">
          <Avatar className={cn('size-7', small && 'size-8')}>
            <AvatarImage src={user?.avatarUrl} alt="User avatar" />
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
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <span className="min-w-0">
              <span className="text-emphasis block truncate text-sm font-semibold leading-tight">
                {isPending ? 'Loading…' : (user?.name ?? 'Nameless User')}
              </span>
              <span className="text-subtle block truncate text-xs leading-tight">
                {user?.email || `@${user?.username ?? 'user'}`}
              </span>
            </span>
            <ChevronDownIcon
              className="text-muted h-3.5 w-3.5 shrink-0 transition"
              aria-hidden="true"
            />
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" sideOffset={8} className="w-64">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="size-9">
            <AvatarImage src={user?.avatarUrl} alt="User avatar" />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-emphasis truncate text-sm font-semibold">
              {user?.name ?? 'Nameless User'}
            </p>
            <p className="text-subtle truncate text-xs">
              {user?.email || `@${user?.username ?? 'user'}`}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />

        {!isPlatformPages && (
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/app/settings">
                <UserIcon />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/app/settings">
                <SettingsIcon />
                Settings
              </Link>
            </DropdownMenuItem>
            <div className="py-1">
              <ThemeToggle />
            </div>
            <DropdownMenuSeparator />
          </DropdownMenuGroup>
        )}

        <DropdownMenuItem
          variant="destructive"
          onClick={async () => {
            try {
              await logout.mutateAsync();
            } catch {
              // Ignore logout errors and still redirect.
            } finally {
              router.push('/auth/login');
            }
          }}
        >
          <LogOutIcon />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
