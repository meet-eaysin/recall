'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
import { useAuthSession, useLogout } from '@/features/auth/hooks';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu';
import {
  User as UserIcon,
  Settings as SettingsIcon,
  LogOut as LogOutIcon,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
} from 'lucide-react';

export function NavUser() {
  const { data: session, status } = useAuthSession();
  const logout = useLogout();
  const router = useRouter();
  const pathname = usePathname();
  const isPlatformPages = pathname?.startsWith('/app/settings/platform');
  const { isMobile, state } = useSidebar();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const user = React.useMemo(() => {
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
    };
  }, [session?.user]);

  const isPending = status === 'loading' || logout.isPending;
  const isCollapsed = state === 'collapsed' && !isMobile;

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
    <SidebarMenu>
      <SidebarMenuItem>
        <Menu open={menuOpen} onOpenChange={setMenuOpen}>
          <MenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className={cn(
                  'aria-expanded:bg-muted',
                  isCollapsed && 'justify-center',
                )}
                disabled={isPending}
                data-testid="user-dropdown-trigger-button"
              />
            }
          >
            <span className="relative shrink-0">
              <Avatar className="size-8">
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
            {!isCollapsed && (
              <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                <span className="min-w-0">
                  <span className="text-emphasis block truncate text-sm font-semibold leading-tight">
                    {isPending ? 'Loading…' : (user?.name ?? 'Nameless User')}
                  </span>
                  <span className="text-subtle block truncate text-xs leading-tight">
                    {user?.email || `@${user?.username ?? 'user'}`}
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
          <MenuPopup
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={8}
            className="w-64"
          >
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
            <MenuSeparator />

            {!isPlatformPages && (
              <>
                <MenuItem render={<Link href="/app/settings" />}>
                  <UserIcon />
                  Profile
                </MenuItem>
                <MenuItem render={<Link href="/app/settings" />}>
                  <SettingsIcon />
                  Settings
                </MenuItem>
                <div className="py-1">
                  <ThemeToggle />
                </div>
                <MenuSeparator />
              </>
            )}

            <MenuItem
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
            </MenuItem>
          </MenuPopup>
        </Menu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
