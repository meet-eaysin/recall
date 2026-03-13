'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  isFullHeight?: boolean;
}

export function PageContainer({
  children,
  className,
  isFullHeight = false,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'w-full',
        !isFullHeight
          ? 'max-w-5xl mx-auto px-4 md:px-8 pt-4 pb-32'
          : 'flex-1 flex flex-col h-full min-h-0 pt-4 pb-20',
        className,
      )}
    >
      {children}
    </div>
  );
}
