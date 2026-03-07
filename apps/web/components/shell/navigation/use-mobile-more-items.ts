import type { NavigationItemType } from './navigation-item';

const useSession = () => ({
  data: {
    user: {
      role: 'ADMIN',
      username: 'mockuser',
      org: { slug: 'mockorg' },
      orgAwareUsername: 'mockuser',
    },
  },
});

const getBookerBaseUrlSync = (_slug: string | null) => 'https://cal.com';

const useBottomNavItems = (_props: unknown) => [
  {
    name: 'event_types',
    href: '/event-types',
    icon: 'link' as const,
  },
  {
    name: 'bookings',
    href: '/bookings',
    icon: 'calendar' as const,
  },
  {
    name: 'settings',
    href: '/settings',
    icon: 'settings' as const,
  },
];

export function useMobileMoreItems(): NavigationItemType[] {
  const { data: session } = useSession();
  const user = session?.user;
  const isAdmin = true;
  const publicPageUrl = `${getBookerBaseUrlSync(user?.org?.slug ?? null)}/${user?.orgAwareUsername ?? user?.username}`;

  const bottomNavItems = useBottomNavItems({
    publicPageUrl,
    isAdmin,
    user,
  });

  const filteredBottomNavItems = bottomNavItems.filter(
    (item: NavigationItemType) => item.name !== 'settings',
  );
  return filteredBottomNavItems;
}
