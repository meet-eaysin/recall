'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  isFullHeight?: boolean;
}

export const PageContainer = React.forwardRef<
  HTMLDivElement,
  PageContainerProps
>(({ children, className, isFullHeight = false }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'w-full flex flex-col min-h-0',
        !isFullHeight
          ? 'mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-10 pb-28 md:pb-28 lg:pb-28'
          : 'flex-1 px-4 md:px-6 lg:px-8 py-2 md:py-3 lg:py-5 pb-28 md:pb-28 lg:pb-28',
        className,
      )}
    >
      {children}
    </div>
  );
});
PageContainer.displayName = 'PageContainer';
