import type { IconName } from '@/components/icon';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { Fragment, useState, useEffect } from 'react';
import { useShouldDisplayNavigationItem } from './use-should-display-navigation-item';
import { cn } from '@/lib/utils';
import { NavIcon } from './nav-icon';

const usePersistedExpansionState = (itemName: string) => {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(`nav-expansion-${itemName}`);
    if (stored !== null) {
      setIsExpanded(JSON.parse(stored));
    }
  }, [itemName]);

  const setPersistedExpansion = (expanded: boolean) => {
    setIsExpanded(expanded);
    sessionStorage.setItem(
      `nav-expansion-${itemName}`,
      JSON.stringify(expanded),
    );
  };

  return [isExpanded, setPersistedExpansion] as const;
};

export type NavigationItemType = {
  name: string;
  label?: string;
  href: string;
  isLoading?: boolean;
  onClick?: React.MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
  target?: HTMLAnchorElement['target'];
  badge?: React.ReactNode;
  icon?: IconName;
  child?: NavigationItemType[];
  pro?: true;
  onlyMobile?: boolean;
  onlyDesktop?: boolean;
  moreOnMobile?: boolean;
  isCurrent?: ({
    item,
    isChild,
    pathname,
  }: {
    item: Pick<NavigationItemType, 'href'>;
    isChild?: boolean;
    pathname: string | null;
  }) => boolean;
};

const formatFallbackLabel = (value: string) =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getItemLabel = (item: Pick<NavigationItemType, 'name' | 'label'>) =>
  item.label ?? formatFallbackLabel(item.name);

const defaultIsCurrent: NavigationItemType['isCurrent'] = ({
  isChild,
  item,
  pathname,
}) => {
  return isChild
    ? item.href === pathname
    : item.href
      ? (pathname?.startsWith(item.href) ?? false)
      : false;
};

export const NavigationItem: React.FC<{
  index?: number;
  item: NavigationItemType;
  isChild?: boolean;
}> = (props) => {
  const { item, isChild } = props;
  const pathname = usePathname();
  const isCurrent: NavigationItemType['isCurrent'] =
    item.isCurrent || defaultIsCurrent;
  const current = isCurrent({ isChild: !!isChild, item, pathname });
  const shouldDisplayNavigationItem = useShouldDisplayNavigationItem(
    props.item,
  );
  const [isExpanded, setIsExpanded] = usePersistedExpansionState(item.name);
  const itemLabel = getItemLabel(item);

  if (!shouldDisplayNavigationItem) return null;

  const hasChildren = item.child && item.child.length > 0;
  const hasActiveChild =
    hasChildren &&
    item.child?.some((child) =>
      isCurrent({ isChild: true, item: child, pathname }),
    );
  const shouldShowChildren =
    isExpanded || hasActiveChild || isCurrent({ pathname, isChild, item });
  const shouldShowChevron = hasChildren && !hasActiveChild;
  const isParentNavigationItem = hasChildren && !isChild;
  const baseItemClass =
    'group mt-0.5 flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm leading-5 font-semibold transition-colors';
  const topLevelStateClass = current
    ? 'bg-subtle text-emphasis'
    : 'text-default hover:bg-subtle/80 hover:text-emphasis';
  const topLevelLayoutClass = 'md:justify-center lg:justify-start';
  const childClass = current
    ? 'bg-subtle text-emphasis'
    : 'text-muted hover:bg-subtle/70 hover:text-default';
  const itemLabelClass = isChild
    ? 'truncate'
    : 'hidden w-full items-center justify-between truncate lg:flex';

  return (
    <Fragment>
      {isParentNavigationItem ? (
        <button
          data-test-id={item.name}
          aria-label={itemLabel}
          aria-expanded={isExpanded}
          aria-current={current ? 'page' : undefined}
          onClick={() => {
            if (hasChildren) {
              setIsExpanded(!isExpanded);
            }
          }}
          className={cn(baseItemClass, topLevelStateClass, topLevelLayoutClass)}
        >
          {item.icon && (
            <NavIcon
              name={item.isLoading ? 'rotate-cw' : item.icon}
              className={cn('h-4 w-4 shrink-0', item.isLoading && 'animate-spin')}
            />
          )}
          <span className={itemLabelClass} data-testid={`${item.name}-test`}>
            {itemLabel}
            {item.badge && item.badge}
          </span>
          {shouldShowChevron && (
            <NavIcon
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              className="ml-auto hidden h-4 w-4 lg:block"
            />
          )}
        </button>
      ) : (
        <Link
          data-test-id={item.name}
          href={item.href}
          aria-label={itemLabel}
          target={item.target}
          className={cn(
            baseItemClass,
            isChild ? childClass : topLevelStateClass,
            isChild
              ? cn(
                  'hidden py-1.5 text-[13px] leading-5 lg:flex lg:pl-9',
                  props.index === 0 ? 'mt-1' : '',
                )
              : topLevelLayoutClass,
          )}
          aria-current={current ? 'page' : undefined}
        >
          {item.icon && !isChild && (
            <NavIcon
              name={item.isLoading ? 'rotate-cw' : item.icon}
              className={cn('h-4 w-4 shrink-0', item.isLoading && 'animate-spin')}
            />
          )}
          <span className={itemLabelClass} data-testid={`${item.name}-test`}>
            {itemLabel}
            {item.badge && item.badge}
          </span>
        </Link>
      )}
      {hasChildren && (
        <div
          className={cn(
            'grid transition-all duration-300 ease-in-out',
            shouldShowChildren
              ? 'grid-rows-[1fr] opacity-100 visible'
              : 'grid-rows-[0fr] opacity-0 invisible',
          )}
          aria-hidden={!shouldShowChildren}
        >
          <div className="overflow-hidden">
            {item.child?.map((item, index) => (
              <NavigationItem
                index={index}
                key={item.name}
                item={item}
                isChild
              />
            ))}
          </div>
        </div>
      )}
    </Fragment>
  );
};

export const MobileNavigationItem: React.FC<{
  item: NavigationItemType;
  isChild?: boolean;
}> = (props) => {
  const { item, isChild } = props;
  const itemLabel = getItemLabel(item);
  const pathname = usePathname();
  const isCurrent: NavigationItemType['isCurrent'] =
    item.isCurrent || defaultIsCurrent;
  const current = isCurrent({ isChild: !!isChild, item, pathname });
  const shouldDisplayNavigationItem = useShouldDisplayNavigationItem(
    props.item,
  );

  if (!shouldDisplayNavigationItem) return null;
  return (
    <Link
      key={item.name}
      href={item.href}
      target={item.target}
      className="aria-[aria-current='page']:text-emphasis hover:text-default text-muted bg-transparent! relative my-2 min-w-0 flex-1 overflow-hidden rounded-md p-1 text-center text-xs font-semibold focus:z-10 sm:text-sm"
      aria-current={current ? 'page' : undefined}
    >
      {item.badge && <div className="absolute right-1 top-1">{item.badge}</div>}
      {item.icon && (
        <NavIcon
          name={item.icon}
          className="aria-[aria-current='page']:text-emphasis  mx-auto mb-1 block h-5 w-5 shrink-0 text-center text-inherit"
        />
      )}

      <span className="block truncate text-[11px] leading-4 font-semibold sm:text-xs">
        {itemLabel}
      </span>
    </Link>
  );
};

export const MobileNavigationMoreItem: React.FC<{
  item: NavigationItemType;
  isChild?: boolean;
}> = (props) => {
  const { item } = props;
  const itemLabel = getItemLabel(item);
  const shouldDisplayNavigationItem = useShouldDisplayNavigationItem(
    props.item,
  );
  const [isExpanded, setIsExpanded] = usePersistedExpansionState(item.name);

  if (!shouldDisplayNavigationItem) return null;

  const hasChildren = item.child && item.child.length > 0;
  const isActionItem = !item.href && item.onClick;

  const itemContent = (
    <>
      <span className="text-default flex items-center font-semibold ">
        {item.icon && (
          <NavIcon
            name={item.icon}
            className="h-5 w-5 shrink-0 ltr:mr-3 rtl:ml-3"
          />
        )}
        {itemLabel}
      </span>
      {!isActionItem && (
        <NavIcon name="arrow-right" className="text-subtle h-5 w-5" />
      )}
    </>
  );

  return (
    <li className="border-subtle border-b last:border-b-0" key={item.name}>
      {hasChildren ? (
        <>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="hover:bg-subtle flex w-full items-center justify-between p-5 text-left font-semibold transition"
          >
            <span className="text-default flex items-center font-semibold">
              {item.icon && (
                <NavIcon
                  name={item.icon}
                  className="h-5 w-5 shrink-0 ltr:mr-3 rtl:ml-3"
                />
              )}
              {itemLabel}
            </span>
            <NavIcon
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              className="text-subtle h-5 w-5"
            />
          </button>
          <div
            className={cn(
              'grid transition-all duration-300 ease-in-out',
              isExpanded
                ? 'grid-rows-[1fr] opacity-100'
                : 'grid-rows-[0fr] opacity-0',
            )}
          >
            <div className="overflow-hidden">
              {item.child && (
                <ul className="bg-subtle">
                  {item.child.map((childItem) => (
                    <li key={childItem.name} className="border-subtle border-t">
                      <Link
                        href={childItem.href}
                        className="hover:bg-cal-muted flex items-center p-4 pl-12 font-semibold transition"
                      >
                        <span className="text-default font-medium">
                          {getItemLabel(childItem)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : isActionItem ? (
        <button
          onClick={item.onClick}
          className="hover:bg-subtle flex w-full items-center justify-between p-5 text-left font-semibold transition"
        >
          {itemContent}
        </button>
      ) : (
        <Link
          href={item.href}
          target={item.target}
          className="hover:bg-subtle flex items-center justify-between p-5 font-semibold transition"
        >
          {itemContent}
        </Link>
      )}
    </li>
  );
};
