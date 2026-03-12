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
  isFullHeight = false 
}: PageContainerProps) {
  return (
    <div className={cn(
      "w-full px-4 md:px-8 pt-4 pb-32",
      !isFullHeight && "max-w-5xl mx-auto",
      isFullHeight && "h-full flex flex-col",
      className
    )}>
      {children}
    </div>
  );
}
