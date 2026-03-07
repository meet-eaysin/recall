import { useMemo } from 'react';
import {
  MobileNavigationItem,
  MobileNavigationMoreItem,
  NavigationItem,
  NavigationItemType,
} from './navigation-item';
import UnconfirmedBookingBadge from '../unconfirmed-booking-badge';
import { useMobileMoreItems } from './use-mobile-more-items';

export const MORE_SEPARATOR_NAME = 'more';

const getNavigationItems = (): NavigationItemType[] => [
  {
    name: 'inbox',
    label: 'Inbox',
    href: '/event-types',
    icon: 'link',
  },
  {
    name: 'bookings',
    label: 'Bookings',
    href: '/bookings/upcoming',
    icon: 'calendar',
    badge: <UnconfirmedBookingBadge />,
    isCurrent: ({ pathname }) => pathname?.startsWith('/bookings') ?? false,
  },
  {
    name: 'availability',
    label: 'Availability',
    href: '/availability',
    icon: 'clock',
  },
  {
    name: 'teams',
    label: 'Teams',
    href: '/teams',
    icon: 'users',
    isCurrent: ({ pathname }) => pathname?.startsWith('/teams') ?? false,
  },
  {
    name: 'apps',
    label: 'Apps',
    href: '/apps',
    icon: 'grid-3x3',
    moreOnMobile: true,
    isCurrent: ({ pathname: path, item }) => {
      return (
        (path?.startsWith(item.href) ?? false) &&
        !(path?.includes('routing-forms/') ?? false)
      );
    },
    child: [
      {
        name: 'app_store',
        label: 'App Store',
        href: '/apps',
        isCurrent: ({ pathname: path, item }) => {
          // During Server rendering path is /v2/apps but on client it becomes /apps(weird..)
          return (
            (path?.startsWith(item.href) ?? false) &&
            !(path?.includes('routing-forms/') ?? false) &&
            !(path?.includes('/installed') ?? false)
          );
        },
      },
      {
        name: 'installed_apps',
        label: 'Installed Apps',
        href: '/apps/installed/calendar',
        isCurrent: ({ pathname: path }) =>
          (path?.startsWith('/apps/installed/') ?? false) ||
          (path?.startsWith('/v2/apps/installed/') ?? false),
      },
    ],
  },
  {
    name: MORE_SEPARATOR_NAME,
    href: '/more',
    icon: 'ellipsis',
  },
  {
    name: 'routing',
    label: 'Routing',
    href: '/routing',
    icon: 'split',
    isCurrent: ({ pathname }) => pathname?.startsWith('/routing') ?? false,
    moreOnMobile: true,
  },
  {
    name: 'workflows',
    label: 'Workflows',
    href: '/workflows',
    icon: 'zap',
    moreOnMobile: true,
  },
  {
    name: 'insights',
    label: 'Insights',
    href: '/insights',
    icon: 'chart-bar',
    isCurrent: ({ pathname: path, item }) =>
      path?.startsWith(item.href) ?? false,
    moreOnMobile: true,
    child: [
      {
        name: 'bookings',
        label: 'Bookings',
        href: '/insights',
        isCurrent: ({ pathname: path }) => path === '/insights',
      },
      {
        name: 'routing',
        label: 'Routing',
        href: '/insights/routing',
        isCurrent: ({ pathname: path }) =>
          path?.startsWith('/insights/routing') ?? false,
      },
      {
        name: 'router_position',
        label: 'Router Position',
        href: '/insights/router-position',
        isCurrent: ({ pathname: path }) =>
          path?.startsWith('/insights/router-position') ?? false,
      },
      {
        name: 'call_history',
        label: 'Call History',
        href: '/insights/call-history',
        // icon: "phone",
        isCurrent: ({ pathname: path }) =>
          path?.startsWith('/insights/call-history') ?? false,
      },
      {
        name: 'wrong_routing',
        label: 'Wrong Routing',
        href: '/insights/wrong-routing',
        isCurrent: ({ pathname: path }) =>
          path?.startsWith('/insights/wrong-routing') ?? false,
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

const useMockSession = () => ({
  status: 'authenticated' as const,
});

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
  const { status } = useMockSession();
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
      <nav
        className="pwa:pb-[max(0.25rem,env(safe-area-inset-bottom))] pwa:-mx-2 bg-cal-muted/40 border-subtle fixed bottom-0 left-0 z-30 flex w-full border-t px-1 shadow backdrop-blur-md md:hidden"
      >
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
