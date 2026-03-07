import { useMemo } from 'react';

const useIsEmbed = () => false;

const useMobileMoreItems = () => [];
const useIsStandalone = () => false;

import type { NavigationItemType } from './navigation-item';
import {
  NavigationItem,
  MobileNavigationItem,
  MobileNavigationMoreItem,
} from './navigation-item';
import { cn } from '@/lib/utils';

export const MORE_SEPARATOR_NAME = 'more';

const getNavigationItems = (): NavigationItemType[] => [
  {
    name: 'Dashboard',
    href: '/',
    icon: 'layout-dashboard',
  },
  {
    name: 'Documents',
    href: '/documents',
    icon: 'file-text',
  },
  {
    name: 'Knowledge Graph',
    href: '/graph',
    icon: 'blocks',
  },
  {
    name: 'Search & Ask',
    href: '/search',
    icon: 'search',
  },
  {
    name: 'Daily Review',
    href: '/review',
    icon: 'book-open',
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: 'chart-line',
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: 'settings',
  },
];

const useNavigationItems = () => {
  return useMemo(() => {
    const items = getNavigationItems();

    return {
      desktopNavigationItems: items,
      mobileNavigationBottomItems: items,
      mobileNavigationMoreItems: [],
    };
  }, []);
};

export const Navigation = () => {
  const { desktopNavigationItems } = useNavigationItems();

  return (
    <nav className="mt-2 flex-1 md:px-2 lg:mt-4 lg:px-0">
      {desktopNavigationItems.map((item) => (
        <NavigationItem key={item.name} item={item} />
      ))}
    </nav>
  );
};

export function MobileNavigationContainer() {
  const isStandalone = useIsStandalone();
  if (isStandalone) return null;
  return <MobileNavigation />;
}

const MobileNavigation = () => {
  const isEmbed = useIsEmbed();
  const { mobileNavigationBottomItems } = useNavigationItems();

  return (
    <>
      <nav
        className={cn(
          'pwa:pb-[max(0.25rem,env(safe-area-inset-bottom))] pwa:-mx-2 bg-cal-muted/40 border-subtle fixed bottom-0 left-0 z-30 flex w-full border-t px-1 shadow backdrop-blur-md md:hidden',
          isEmbed && 'hidden',
        )}
      >
        {mobileNavigationBottomItems.map((item) => (
          <MobileNavigationItem key={item.name} item={item} />
        ))}
      </nav>
      {/* add padding to content for mobile navigation*/}
      <div className="block pt-12 md:hidden" />
    </>
  );
};

export const MobileNavigationMoreItems = () => {
  const { mobileNavigationMoreItems } = useNavigationItems();
  const bottomItems = useMobileMoreItems();

  const allItems: NavigationItemType[] = [
    ...mobileNavigationMoreItems,
    ...bottomItems,
  ];

  return (
    <ul className="border-subtle mt-2 rounded-md border">
      {allItems.map((item) => (
        <MobileNavigationMoreItem key={item.name} item={item} />
      ))}
    </ul>
  );
};
