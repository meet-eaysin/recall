import { useMemo } from 'react';
import type { NavigationItemType } from './navigation-item';
import {
  MobileNavigationItem,
  MobileNavigationMoreItem,
  NavigationItem,
} from './navigation-item';
import { useMobileMoreItems } from './use-mobile-more-items';
import { useAuthSession } from '@/features/auth/hooks';

export const MORE_SEPARATOR_NAME = 'more';

const getNavigationItems = (): NavigationItemType[] => [
  {
    name: 'home',
    label: 'Home',
    href: '/app',
    icon: 'layout-dashboard',
    isCurrent: ({ pathname }) => pathname === '/app',
  },
  {
    name: 'documents',
    label: 'Documents',
    href: '/app/library',
    icon: 'library',
    isCurrent: ({ pathname }) => pathname?.startsWith('/app/library') ?? false,
  },
  {
    name: 'search',
    label: 'Search & Ask',
    href: '/app/search',
    icon: 'search',
    isCurrent: ({ pathname }) => pathname?.startsWith('/app/search') ?? false,
  },
  {
    name: 'knowledge_graph',
    label: 'Knowledge Graph',
    href: '/app/graph',
    icon: 'waypoints',
    isCurrent: ({ pathname }) => pathname?.startsWith('/app/graph') ?? false,
  },
  {
    name: 'analytics',
    label: 'Analytics',
    href: '/app/analytics',
    icon: 'chart-line',
    isCurrent: ({ pathname }) =>
      pathname?.startsWith('/app/analytics') ?? false,
  },
  {
    name: MORE_SEPARATOR_NAME,
    href: '/more',
    icon: 'ellipsis',
  },
  {
    name: 'settings',
    label: 'Settings',
    href: '/app/settings',
    icon: 'settings',
    isCurrent: ({ pathname }) => pathname?.startsWith('/app/settings') ?? false,
    moreOnMobile: true,
    child: [
      {
        name: 'profile',
        label: 'Profile',
        href: '/app/settings',
        isCurrent: ({ pathname }) => pathname === '/app/settings',
      },
      {
        name: 'security',
        label: 'Security',
        href: '/app/settings/security',
        isCurrent: ({ pathname }) =>
          pathname?.startsWith('/app/settings/security') ?? false,
      },
      {
        name: 'llm_config',
        label: 'LLM Config',
        href: '/app/settings/llm',
        isCurrent: ({ pathname }) =>
          pathname?.startsWith('/app/settings/llm') ?? false,
      },
    ],
  },
];

const platformNavigationItems: NavigationItemType[] = [
  {
    name: 'dashboard',
    label: 'Dashboard',
    href: '/settings/platform/',
    icon: 'layout-dashboard',
  },
  {
    name: 'documentation',
    label: 'Documentation',
    href: 'https://docs.cal.com/docs/platform',
    icon: 'chart-bar',
    target: '_blank',
  },
  {
    name: 'api_reference',
    label: 'API Reference',
    href: 'https://api.cal.com/v2/docs#/',
    icon: 'terminal',
    target: '_blank',
  },
  {
    name: 'atoms',
    label: 'Atoms',
    href: 'https://docs.cal.com/docs/platform#atoms',
    icon: 'atom',
    target: '_blank',
  },
  {
    name: MORE_SEPARATOR_NAME,
    href: 'https://docs.cal.com/docs/platform/faq',
    icon: 'ellipsis',
    target: '_blank',
  },
  {
    name: 'billing',
    label: 'Billing',
    href: '/settings/platform/billing',
    icon: 'credit-card',
    moreOnMobile: true,
  },
  {
    name: 'members',
    label: 'Members',
    href: '/settings/platform/members',
    icon: 'users',
    moreOnMobile: true,
  },
  {
    name: 'managed_users',
    label: 'Managed Users',
    href: '/settings/platform/managed-users',
    icon: 'users',
    moreOnMobile: true,
  },
];

const useNavigationItems = (isPlatformNavigation = false) => {
  return useMemo(() => {
    const items = !isPlatformNavigation
      ? getNavigationItems()
      : platformNavigationItems;

    const desktopNavigationItems = items.filter(
      (item) => item.name !== MORE_SEPARATOR_NAME,
    );
    const mobileNavigationBottomItems = items.filter(
      (item) =>
        (!item.moreOnMobile && !item.onlyDesktop) ||
        item.name === MORE_SEPARATOR_NAME,
    );
    const mobileNavigationMoreItems = items.filter(
      (item) =>
        item.moreOnMobile &&
        !item.onlyDesktop &&
        item.name !== MORE_SEPARATOR_NAME,
    );

    return {
      desktopNavigationItems,
      mobileNavigationBottomItems,
      mobileNavigationMoreItems,
    };
  }, [isPlatformNavigation]);
};

export const Navigation = ({
  isPlatformNavigation = false,
}: {
  isPlatformNavigation?: boolean;
}) => {
  const { desktopNavigationItems } = useNavigationItems(isPlatformNavigation);

  return (
    <nav className="flex-1">
      {desktopNavigationItems.map((item) => (
        <NavigationItem key={item.name} item={item} />
      ))}
    </nav>
  );
};

export function MobileNavigationContainer({
  isPlatformNavigation = false,
}: {
  isPlatformNavigation?: boolean;
}) {
  const { status } = useAuthSession();
  if (status !== 'authenticated') return null;
  return <MobileNavigation isPlatformNavigation={isPlatformNavigation} />;
}

const MobileNavigation = ({
  isPlatformNavigation = false,
}: {
  isPlatformNavigation?: boolean;
}) => {
  const { mobileNavigationBottomItems } =
    useNavigationItems(isPlatformNavigation);

  return (
    <>
      <nav className="pwa:pb-[max(0.25rem,env(safe-area-inset-bottom))] pwa:-mx-2 bg-cal-muted/40 border-subtle fixed bottom-0 left-0 z-30 flex w-full border-t px-1 shadow backdrop-blur-md md:hidden">
        {mobileNavigationBottomItems.map((item) => (
          <MobileNavigationItem key={item.name} item={item} />
        ))}
      </nav>
      <div className="block pt-12 md:hidden" />
    </>
  );
};

export const MobileNavigationMoreItems = () => {
  const { mobileNavigationMoreItems } = useNavigationItems();
  const bottomItems = useMobileMoreItems();

  const allItems = [...mobileNavigationMoreItems, ...bottomItems];

  return (
    <ul className="border-subtle mt-2 rounded-md border">
      {allItems.map((item) => (
        <MobileNavigationMoreItem key={item.name} item={item} />
      ))}
    </ul>
  );
};
