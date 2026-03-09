'use client';

import { useRouter } from 'next/navigation';
import type {
  Dispatch,
  JSX,
  ReactElement,
  ReactNode,
  SetStateAction,
} from 'react';
import React, { cloneElement } from 'react';

import { MobileNavigationContainer } from './navigation/navigation';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { SideBarContainer } from './side-bar';
import { TopNavContainer } from './top-nav';
import { ArrowLeft } from 'lucide-react';

const Layout = (props: LayoutProps) => {
  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1" data-testid="dashboard-shell">
          {props.SidebarContainer ? (
            cloneElement(props.SidebarContainer)
          ) : (
            <SideBarContainer bannersHeight={0} />
          )}
          <div className="flex w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
            <MainContainer {...props} />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

type DrawerState = [
  isOpen: boolean,
  setDrawerOpen: Dispatch<SetStateAction<boolean>>,
];

export type LayoutProps = {
  centered?: boolean;
  title?: string;
  description?: string;
  heading?: ReactNode;
  subtitle?: ReactNode;
  breadcrumbs?: ReactNode;
  headerClassName?: string;
  children: ReactNode;
  CTA?: ReactNode;
  large?: boolean;
  MobileNavigationContainer?: ReactNode;
  SidebarContainer?: ReactElement;
  TopNavContainer?: ReactNode;
  drawerState?: DrawerState;
  HeadingLeftIcon?: ReactNode;
  backPath?: string | boolean;
  flexChildrenContainer?: boolean;
  isPublic?: boolean;
  withoutMain?: boolean;
  actions?: JSX.Element;
  beforeCTAactions?: JSX.Element;
  afterHeading?: ReactNode;
  smallHeading?: boolean;
  disableSticky?: boolean;
};

export default function Shell(props: LayoutProps) {
  return <Layout {...props} />;
}

export function ShellMain(props: LayoutProps) {
  const router = useRouter();

  return (
    <>
      {(props.heading || !!props.backPath) && (
        <div
          className={cn(
            'bg-default mb-0 flex items-center md:mb-6 md:mt-0',
            props.smallHeading ? 'lg:mb-7' : 'lg:mb-8',
            !props.disableSticky && 'sticky top-0 z-10',
          )}
        >
          {!!props.backPath && (
            <button
              type="button"
              onClick={() =>
                typeof props.backPath === 'string'
                  ? router.push(props.backPath as string)
                  : router.back()
              }
              aria-label="Go Back"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-default transition hover:bg-subtle ltr:mr-2 rtl:ml-2"
              data-testid="go-back-button"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          {props.heading && (
            <header
              className={cn(
                props.large && 'py-8',
                'flex w-full max-w-full items-center truncate',
              )}
            >
              {props.HeadingLeftIcon && (
                <div className="ltr:mr-4">{props.HeadingLeftIcon}</div>
              )}
              <div
                className={cn(
                  'w-full truncate ltr:mr-4 rtl:ml-4 md:block',
                  props.headerClassName,
                )}
              >
                {props.heading && (
                  <h3
                    className={cn(
                      'text-emphasis max-w-28 sm:max-w-72 md:max-w-80 hidden truncate text-lg font-semibold tracking-wide sm:text-xl md:block xl:max-w-full',
                      props.smallHeading ? 'text-sm' : 'text-xl',
                    )}
                  >
                    {props.heading}
                  </h3>
                )}
                {props.subtitle && (
                  <p
                    className="text-subtle hidden text-sm md:block"
                    data-testid="subtitle"
                  >
                    {props.subtitle}
                  </p>
                )}
              </div>
              {props.beforeCTAactions}
              {props.CTA && (
                <div
                  className={cn(
                    props.backPath
                      ? 'relative'
                      : 'fixed bottom-20 z-40 ltr:right-4 rtl:left-4 md:z-auto md:ltr:right-0 md:rtl:left-0',
                    'shrink-0 md:relative md:bottom-auto md:right-auto',
                  )}
                >
                  {props.CTA}
                </div>
              )}
              {props.actions && props.actions}
            </header>
          )}
        </div>
      )}
      {props.breadcrumbs && <div className="mb-4">{props.breadcrumbs}</div>}
      {props.afterHeading && <>{props.afterHeading}</>}
      <div
        className={cn(props.flexChildrenContainer && 'flex flex-1 flex-col')}
      >
        {props.children}
      </div>
    </>
  );
}

function MainContainer({
  MobileNavigationContainer: MobileNavigationContainerProp = (
    <MobileNavigationContainer />
  ),
  TopNavContainer: TopNavContainerProp = <TopNavContainer />,
  ...props
}: LayoutProps) {
  return (
    <main className="bg-default relative z-0 flex-1 focus:outline-none">
      {TopNavContainerProp}
      <div className="max-w-full p-2 sm:p-4 lg:p-6">
        {!props.withoutMain ? (
          <ShellMain {...props}>{props.children}</ShellMain>
        ) : (
          props.children
        )}
        {!props.backPath ? MobileNavigationContainerProp : null}
      </div>
    </main>
  );
}
